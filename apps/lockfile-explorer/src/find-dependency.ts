// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { FileSystem } from '@rushstack/node-core-library';
import yaml from 'js-yaml';
import { getAppState } from './init';
import type { Lockfile } from '@pnpm/lockfile-types';
import {normalizeDependencyPathToV5} from './utils';
import { AlreadyReportedError, PackageJsonLookup, type IPackageJson } from '@rushstack/node-core-library';
import { RushConfiguration, RushConfigurationProject } from '@microsoft/rush-lib';
import {isRushAppState} from './state';
import path from 'path';

interface IDependencyOccurrence {
}

interface DependencyDeclaration {
  specifier: string;
  version: string;
}

interface DependencyDeclarations {
  [packageName: string]: DependencyDeclaration;
}

export async function findDependencyOccurrences (packageName: string): Promise<IDependencyOccurrence[]> {
  const appState = getAppState();
  if (!isRushAppState(appState)) {
    throw new Error("non rush project not supported");
  }
  const { rushConfiguration } = appState.rush;
  const project = rushConfiguration.tryGetProjectForPath(process.cwd());
  if (!project) {
    throw new Error("specify a subspace or cd into a project");
  }
  console.error(`Finding ${packageName} from ${project.projectFolder}`);

  const lockfilePath = project.subspace.getCommittedShrinkwrapFilename();
  const dependencies = getDirectDependencies(lockfilePath, project.projectFolder);

  for (const [packageName, { version, specifier }] of Object.entries(dependencies)) {

  }

  return [];
}

/**
* Used for CLI output, expect to be processed by other text commands
*/
export function summarizeDependencyOccurrences (occurrences: IDependencyOccurrence[]): string {
  return JSON.stringify(occurrences, null, 2)
}

export function getDirectDependencies(pnpmLockfileLocation: string, projectFolder: string): DependencyDeclarations {
  console.error("reading", pnpmLockfileLocation);
  const pnpmLockfileText: string = FileSystem.readFile(pnpmLockfileLocation);
  const doc = yaml.load(pnpmLockfileText) as Lockfile;
  normalizeDependencyPathToV5(doc);
  const allDependencies = {}
  Object.entries(doc.importers)
    // only dependencies for current project is concerned
    .filter(([relativePath]) => path.resolve(projectFolder, relativePath) === projectFolder)
    .forEach(([, { dependencies, devDependencies }]) => Object.assign(allDependencies, devDependencies, dependencies))
  return allDependencies;
}
