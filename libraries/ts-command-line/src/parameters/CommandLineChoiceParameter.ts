// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import type { ICommandLineChoiceDefinition } from './CommandLineDefinition';
import { CommandLineParameterBase, CommandLineParameterKind } from './BaseClasses';

/**
 * The data type returned by {@link CommandLineParameterProvider.(defineChoiceParameter:2)}.
 * @public
 */
export interface IRequiredCommandLineChoiceParameter<TChoice extends string = string>
  extends CommandLineChoiceParameter<TChoice> {
  value: TChoice;
}

/**
 * The data type returned by {@link CommandLineParameterProvider.(defineChoiceParameter:1)}.
 * @public
 */
export class CommandLineChoiceParameter<TChoice extends string = string> extends CommandLineParameterBase {
  /** {@inheritDoc ICommandLineChoiceDefinition.alternatives} */
  public readonly alternatives: ReadonlyArray<TChoice>;

  /** {@inheritDoc ICommandLineStringDefinition.defaultValue} */
  public readonly defaultValue: TChoice | undefined;

  private _value: TChoice | undefined = undefined;

  /** {@inheritDoc ICommandLineChoiceDefinition.completions} */
  public readonly completions: (() => Promise<TChoice[]>) | undefined;

  /** {@inheritDoc CommandLineParameter.kind} */
  public readonly kind: CommandLineParameterKind.Choice = -CommandLineParameterKind.Choice;

  /** @internal */
  public constructor(definition: ICommandLineChoiceDefinition<TChoice>) {
    super(definition);

    if (definition.alternatives.length < 1) {
      throw new Error(
        `When defining a choice parameter, the alternatives list must contain at least one value.`
      );
    }
    if (definition.defaultValue && definition.alternatives.indexOf(definition.defaultValue) === -1) {
      throw new Error(
        `The specified default value "${definition.defaultValue}"` +
          ` is not one of the available options: ${definition.alternatives.toString()}`
      );
    }

    this.alternatives = definition.alternatives;
    this.defaultValue = definition.defaultValue;
    this.validateDefaultValue(!!this.defaultValue);
    this.completions = definition.completions;
  }

  /**
   * {@inheritDoc CommandLineParameter._setValue}
   * @internal
   */
  public _setValue(data: unknown): void {
    // abstract
    if (data !== null && data !== undefined) {
      if (typeof data !== 'string') {
        this.reportInvalidData(data);
      }
      this._value = data as TChoice;
      return;
    }

    if (this.environmentVariable !== undefined) {
      // Try reading the environment variable
      const environmentValue: string | undefined = process.env[this.environmentVariable];
      if (environmentValue !== undefined && environmentValue !== '') {
        if (!this.alternatives.includes(environmentValue as TChoice)) {
          const choices: string = '"' + this.alternatives.join('", "') + '"';
          throw new Error(
            `Invalid value "${environmentValue}" for the environment variable` +
              ` ${this.environmentVariable}.  Valid choices are: ${choices}`
          );
        }

        this._value = environmentValue as TChoice;
        return;
      }
    }

    if (this.defaultValue !== undefined) {
      this._value = this.defaultValue;
      return;
    }

    this._value = undefined;
  }

  /**
   * {@inheritDoc CommandLineParameter._getSupplementaryNotes}
   * @internal
   */
  public _getSupplementaryNotes(supplementaryNotes: string[]): void {
    // virtual
    super._getSupplementaryNotes(supplementaryNotes);
    if (this.defaultValue !== undefined) {
      supplementaryNotes.push(`The default value is "${this.defaultValue}".`);
    }
  }

  /**
   * Returns the argument value for a choice parameter that was parsed from the command line.
   *
   * @remarks
   * The return value will be `undefined` if the command-line has not been parsed yet,
   * or if the parameter was omitted and has no default value.
   */
  public get value(): TChoice | undefined {
    return this._value;
  }

  /** {@inheritDoc CommandLineParameter.appendToArgList} @override */
  public appendToArgList(argList: string[]): void {
    if (this.value !== undefined) {
      argList.push(this.longName);
      argList.push(this.value);
    }
  }
}
