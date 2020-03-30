/*
 * Copyright 2019 Tomas Machalek <tomas.machalek@gmail.com>
 * Copyright 2019 Institute of the Czech National Corpus,
 *                Faculty of Arts, Charles University
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

//
// This module contains a customized toolbar as needed
// by CNC integration guidelines. For general use, please
// look at the 'langSwitch' toolbar.

import { Observable } from 'rxjs';

import { HostPageEnv, IToolbarProvider } from '../../common/hostPage';
import { GlobalComponents } from '../../views/global';
import { ViewUtils } from 'kombo';
import axios from 'axios';


interface ToolbarResponse {
    user:any; // TODO

    styles:{
        [ident:string]:{
            package:string;
            module:string;
            version:string;
            url:string;
        }
    };

    scripts:{
        main:string;
        depends:{
            [ident:string]:{
                package:string;
                module:string;
                version:string;
                url:string;
            }
        };
    }

    html:string;
}


export class UCNKToolbar implements IToolbarProvider {

    private readonly url:string;

    private static readonly PASS_ARGS = [
        'cnc_toolbar_sid',
        'cnc_toolbar_at',
        'cnc_toolbar_rmme',
        'cnc_toolbar_lang'
    ];

    private static readonly TOOLBAR_APP_IDENT = 'wag';

    constructor(url:string) {
        this.url = url;
    }

    get(uiLang:string, returnUrl:string, cookies:{[key:string]:string}, ut:ViewUtils<GlobalComponents>):Observable<HostPageEnv> {
        return new Observable<HostPageEnv>((observer) => {
            const args = {
                continue: returnUrl,
                current: UCNKToolbar.TOOLBAR_APP_IDENT
            };
            UCNKToolbar.PASS_ARGS.forEach(arg => {
                args[arg.substr('cnc_toolbar_'.length)] = cookies[arg] || '';
            });
            axios.post<ToolbarResponse>(this.url, args).then(
                (response) => {
                    if (response.status !== 200) {
                        observer.error(
                            new Error(`Toolbar loading failed with error: ${response.statusText} (code ${response.status})`));

                    } else {
                        observer.next({
                            styles: Object.entries(response.data.styles)
                                .sort((x1, x2) => parseInt(x1[0]) - parseInt(x2[0]))
                                .map(v => v[1].url),
                            scripts: Object.entries(response.data.scripts.depends)
                                .sort((x1, x2) => parseInt(x1[0]) - parseInt(x2[0]))
                                .map(v => v[1].url)
                                .concat([response.data.scripts.main]),
                            html: response.data.html,
                            toolbarHeight: '50px'
                        });
                        observer.complete();
                    }
                },
                (err) => {
                    observer.error(err);
                }
            );
        });
    }
 }