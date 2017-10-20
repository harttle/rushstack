// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import {
  CommandLineFlagParameter
} from '@microsoft/ts-command-line';

import { ApiDocumenterCommandLine } from './ApiDocumenterCommandLine';
import { BaseAction } from './BaseAction';
import { DocItemSet } from '../utils/DocItemSet';

import { YamlDocumenter } from '../yaml/YamlDocumenter';
import { OfficeYamlDocumenter } from '../yaml/OfficeYamlDocumenter';

export class YamlAction extends BaseAction {
  private _officeParameter: CommandLineFlagParameter;

  constructor(parser: ApiDocumenterCommandLine) {
    super({
      actionVerb: 'yaml',
      summary: 'Generate documentation as universal reference YAML files (*.yml)',
      documentation: 'Generate documentation as YAML files (*.yml)'
    });
  }

  protected onDefineParameters(): void { // override
    super.onDefineParameters();

    this._officeParameter = this.defineFlagParameter({
      parameterLongName: '--office',
      description: `Enables some additional features specific to Office Add-ins`
    });
  }

  protected onExecute(): void { // override
    const docItemSet: DocItemSet = this.buildDocItemSet();

    const yamlDocumenter: YamlDocumenter = this._officeParameter.value
       ? new OfficeYamlDocumenter(docItemSet, this.inputFolder)
       : new YamlDocumenter(docItemSet);

    yamlDocumenter.generateFiles(this.outputFolder);
  }
}
