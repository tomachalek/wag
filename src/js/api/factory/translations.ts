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

import { IAsyncKeyValueStore } from '../../types';
import { TranslationAPI } from '../abstract/translations';
import { TreqAPI } from '../vendor/treq';
import { CoreApiGroup } from '../coreGroups';
import { IAppServices } from '../../appServices';
import { wrapApiWithTokenAuth } from '../vendor/kontext/tokenApiWrapper';


export function createInstance(apiIdent:string, apiURL:string, appServices:IAppServices, cache:IAsyncKeyValueStore, apiOptions:{}):TranslationAPI<{}, {}> {
	switch (apiIdent) {
        case CoreApiGroup.TREQ:
			return wrapApiWithTokenAuth(
				new TreqAPI(cache, apiURL, appServices),
				appServices,
				apiURL,
				apiOptions["authenticateURL"],
			);
		default:
			throw new Error(`API type "${apiIdent}" not supported for wordSim`);
	}

 }