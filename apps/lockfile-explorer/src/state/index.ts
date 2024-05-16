// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import type { RushConfiguration } from '@microsoft/rush-lib/lib/api/RushConfiguration';

export enum ProjectType {
  RUSH_PROJECT,
  PNPM_WORKSPACE
}

export interface IRushProjectDetails {
  projectName: string;
  projectFolder: string;
}

export interface IAppStateBase {
  lockfileExplorerProjectRoot: string;
  currDir: string;
  projectRoot: string;
  projectType: ProjectType;
  pnpmLockfileLocation: string;
  pnpmfileLocation: string;
  appVersion: string;
  debugMode: boolean;
}

export interface IRushAppState extends IAppStateBase {
  projectType: ProjectType.RUSH_PROJECT;
  rush: {
    rushJsonPath: string;
    rushConfiguration: RushConfiguration;
    projectsByProjectFolder: Map<string, IRushProjectDetails>;
  };
}

export interface IPnpmWorkspaceAppState extends IAppStateBase {
  projectType: ProjectType.PNPM_WORKSPACE;
}

export type IAppState = IRushAppState | IPnpmWorkspaceAppState;

export function isRushAppState (state: IAppState): state is IRushAppState {
  return state.hasOwnProperty("rush");
}
