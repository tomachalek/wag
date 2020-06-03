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
import { Observable, of as rxOf } from 'rxjs';
import { Ident, HTTP } from 'cnc-tskit';

import { cachedAjax$ } from '../../../page/ajax';
import { HTTPHeaders, IAsyncKeyValueStore, SourceDetails } from '../../../types';
import { WordSimApiResponse, IWordSimApi } from '../../abstract/wordSim';
import { map, catchError } from 'rxjs/operators';
import { WordSimModelState } from '../../../models/tiles/wordSim';
import { AjaxError } from 'rxjs/ajax';
import { QueryMatch, QueryType } from '../../../query';
import { InternalResourceInfoApi } from './freqDbSourceInfo';
import { IApiServices } from '../../../appServices';


export interface CNCWord2VecSimApiArgs {
    corpus:string;
    model:string;
    word:string;
    pos:string;
    minScore:number; // default 0
    limit:number; // default 10
}

type HTTPResponse = Array<{
    word:string;
    score:number;
}>;

/**
 * This is a client for CNC's Word-Sim-Service (https://is.korpus.cz/git/machalek/word-sim-service)
 * which is just a glue for http server and word2vec handling libraries.
 */
export class CNCWord2VecSimApi implements IWordSimApi<CNCWord2VecSimApiArgs> {

    private readonly apiURL:string;

    private readonly customHeaders:HTTPHeaders;

    private readonly cache:IAsyncKeyValueStore;

    private readonly srcInfoApi:InternalResourceInfoApi;

    constructor(cache:IAsyncKeyValueStore, apiURL:string, srcInfoURL:string, apiServices:IApiServices) {
        this.apiURL = apiURL;
        this.customHeaders = apiServices.getApiHeaders(apiURL) || {};
        this.cache = cache;
        this.srcInfoApi = srcInfoURL ? new InternalResourceInfoApi(cache, srcInfoURL, apiServices) : null;
    }

    stateToArgs(state:WordSimModelState, queryMatch:QueryMatch):CNCWord2VecSimApiArgs {
        return {
            corpus: state.corpus,
            model: state.model,
            word: queryMatch.lemma,
            pos: queryMatch.pos.length > 0 ? queryMatch.pos[0].value[0]: '', // TODO is the first zero OK? (i.e. we ignore other variants)
            limit: state.maxResultItems,
            minScore: state.minScore
        };
    }

    supportsTweaking():boolean {
        return false;
    }

    supportsMultiWordQueries():boolean {
        return false;
    }

    getSourceDescription(tileId:number, lang:string, corpname:string):Observable<SourceDetails> {
        return this.srcInfoApi ?
            this.srcInfoApi.call({
                tileId: tileId,
                corpname: corpname,
                lang: lang,
                queryType: QueryType.SINGLE_QUERY
            }) :
             rxOf({
                tileId: tileId,
                title: 'Word2Vec/Wang2Vec generated from an unknown source',
                description: '',
                author: '',
                href: '',
                structure: {
                    numTokens: 0 // TODO
                }
            });
    }

    call(queryArgs:CNCWord2VecSimApiArgs):Observable<WordSimApiResponse> {
        const url = this.apiURL + '/corpora/' + queryArgs.corpus + '/similarWords/' + queryArgs.model +
                '/' + queryArgs.word + (queryArgs.pos ? '/' + queryArgs.pos : '');
        return cachedAjax$<HTTPResponse>(this.cache)(
            'GET',
            url,
            {
                limit: queryArgs.limit,
                minScore: queryArgs.minScore
            },
            {headers: this.customHeaders}

        ).pipe(
            catchError(
                (err:AjaxError) => {
                    if (err.status === HTTP.Status.NotFound) {
                        return rxOf<HTTPResponse>([]);
                    }
                    throw err;
                }
            ),
            map(
                (ans) => ({words: ans.map(v => ({
                    word: v.word,
                    score: v.score,
                    interactionId: Ident.puid()
                }))})
            )
        );
    }
}