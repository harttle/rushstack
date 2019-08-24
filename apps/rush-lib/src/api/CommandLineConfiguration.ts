// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import * as path from 'path';
import * as lodash from 'lodash';

import {
  JsonFile,
  JsonSchema,
  FileSystem
} from '@microsoft/node-core-library';

import { RushConstants } from '../logic/RushConstants';

import {
  CommandJson,
  ICommandLineJson,
  ParameterJson
} from './CommandLineJson';

/**
 * Custom Commands and Options for the Rush Command Line
 */
export class CommandLineConfiguration {
  private static _jsonSchema: JsonSchema = JsonSchema.fromFile(
    path.join(__dirname, '../schemas/command-line.schema.json'));

  public readonly commands: CommandJson[] = [];
  public readonly parameters: ParameterJson[] = [];

  /**
   * Loads the configuration from the specified file.  If the file does not exist,
   * then an empty default instance is returned.  If the file contains errors, then
   * an exception is thrown.
   */
  public static loadFromFileOrDefault(jsonFilename: string): CommandLineConfiguration {
    let commandLineJson: ICommandLineJson | undefined = undefined;
    if (FileSystem.exists(jsonFilename)) {
      commandLineJson = JsonFile.loadAndValidate(jsonFilename, CommandLineConfiguration._jsonSchema);
    }

    return new CommandLineConfiguration(commandLineJson);
  }

  /**
   * Loads the configuration from the specified file and applies any ommited default settings.
   * If the file does not exist, then an empty default instance is returned.
   * If the file contains errors, then an exception is thrown.
   */
  public static loadFromFileAndDefault(jsonFilename: string): CommandLineConfiguration {
    let commandLineJson: ICommandLineJson | undefined = undefined;
    if (FileSystem.exists(jsonFilename)) {
      const jsonObject: any = JsonFile.load(jsonFilename);

      // TODO: Investigate appropriate solution
      const defaults =
        [{
          commandKind: 'bulk',
          name: 'build',
          summary: '(EXPERIMENTAL) Build all projects that haven\'t been built, or have changed since they were last'
          + ' built.',
          enableParallelism: true,
          ignoreMissingScript: false,
          ignoreDependencyOrder: false,
          allowWarningsInSuccessfulBuild: false

        },
        {
          commandKind: 'bulk',
          name: 'rebuild',
          summary: 'Clean and rebuild the entire set of projects',
          enableParallelism: true,
          ignoreMissingScript: false,
          ignoreDependencyOrder: false,
          allowWarningsInSuccessfulBuild: false

        }
      ];
      let defaultReBuilds = false;

      // TODO: optimize
      for (const command of jsonObject.commands) {
        if (command.commandKind === 'bulk' && (command.name === 'rebuild' || command.name === 'build')) {
          defaultReBuilds = true;
        }
      }

      // TODO : optimize
      if (defaultReBuilds) {
        lodash.merge(lodash.keyBy(defaults, 'name'), lodash.keyBy(jsonObject.commands, 'name'));
        lodash.merge(jsonObject.commands, defaults);
      }

      const jsonSchema =  CommandLineConfiguration._jsonSchema;
      jsonSchema.validateObject(jsonObject, jsonFilename);
      commandLineJson = jsonObject;

    }

    return new CommandLineConfiguration(commandLineJson);

  }

  /**
   * Use CommandLineConfiguration.loadFromFile()
   */
  private constructor(commandLineJson: ICommandLineJson | undefined) {
    if (commandLineJson) {
      if (commandLineJson.commands) {
        for (const command of commandLineJson.commands) {
          this.commands.push(command);
        }
      }

      if (commandLineJson.parameters) {
        for (const parameter of commandLineJson.parameters) {
          this.parameters.push(parameter);

          // Do some basic validation
          switch (parameter.parameterKind) {
            case 'choice':
              const alternativeNames: string[] = parameter.alternatives.map(x => x.name);

              if (parameter.defaultValue && alternativeNames.indexOf(parameter.defaultValue) < 0) {
                throw new Error(`In ${RushConstants.commandLineFilename}, the parameter "${parameter.longName}",`
                  + ` specifies a default value "${parameter.defaultValue}"`
                  + ` which is not one of the defined alternatives: "${alternativeNames.toString()}"`);
              }
              break;
          }
        }
      }

    }
  }
}
