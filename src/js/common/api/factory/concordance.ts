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
import { DataApi, HTTPHeaders, IAsyncKeyValueStore } from '../../types';
import { IConcordanceApi } from '../../api/abstract/concordance';
import { ConcApi } from '../../api/kontext/concordance';
import { ConcApi as NoskeConcApi } from '../../api/noske/concordance';
import { FCS1SearchRetrieveAPI } from '../../api/clarin/fcs1/searchRetrieve';
import { FCS1ExplainAPI } from '../../api/clarin/fcs1/explain';
import { CoreApiGroup, supportedCoreApiGroups } from '../../api/coreGroups';


export function createApiInstance(cache:IAsyncKeyValueStore, apiIdent:string, apiURL:string, httpHeaders?:HTTPHeaders):IConcordanceApi<{}> {

 	switch (apiIdent) {
		case CoreApiGroup.FCS_V1:
			return new FCS1SearchRetrieveAPI(apiURL, httpHeaders);
 		case CoreApiGroup.KONTEXT:
 			return new ConcApi(false, cache, apiURL, httpHeaders);
		case CoreApiGroup.NOSKE:
			return new NoskeConcApi(cache, apiURL, httpHeaders);
 		default:
 			throw new Error(`Concordance tile API "${apiIdent}" not found. Supported values are: ${supportedCoreApiGroups().join(', ')}`);
 	}
 }


 export function createSourceInfoApiInstance(apiIdent:string, apiURL:string, httpHeaders?:HTTPHeaders):DataApi<{}, {}> {

	switch (apiIdent) {
		case CoreApiGroup.FCS_V1:
			return new FCS1ExplainAPI(apiURL, httpHeaders);
		default:
			return null; // we leave the work for the tile model (we have slight KonText API bias here)
	}
 }
