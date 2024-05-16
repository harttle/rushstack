// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import * as dp from '@pnpm/dependency-path';
import type { Lockfile } from '@pnpm/lockfile-types';

export function convertLockfileV6DepPathToV5DepPath(newDepPath: string): string {
  if (!newDepPath.includes('@', 2) || newDepPath.startsWith('file:')) return newDepPath;
  const index = newDepPath.indexOf('@', newDepPath.indexOf('/@') + 2);
  if (newDepPath.includes('(') && index > dp.indexOfPeersSuffix(newDepPath)) return newDepPath;
  return `${newDepPath.substring(0, index)}/${newDepPath.substring(index + 1)}`;
}

export function getShrinkwrapFileMajorVersion (lockfileVersion: string | number): number {
  let shrinkwrapFileMajorVersion: number;
  if (typeof lockfileVersion === 'string') {
    const isDotIncluded: boolean = lockfileVersion.includes('.');
    shrinkwrapFileMajorVersion = parseInt(
      lockfileVersion.substring(0, isDotIncluded ? lockfileVersion.indexOf('.') : undefined),
      10
    );
  } else if (typeof lockfileVersion === 'number') {
    shrinkwrapFileMajorVersion = Math.floor(lockfileVersion);
  } else {
    shrinkwrapFileMajorVersion = 0;
  }

  if (shrinkwrapFileMajorVersion < 5 || shrinkwrapFileMajorVersion > 6) {
    throw new Error('The current lockfile version is not supported.');
  }
  return shrinkwrapFileMajorVersion;
}

export function normalizeDependencyPathToV5 (doc: Lockfile): Lockfile {
  const { packages, lockfileVersion } = doc;

  const shrinkwrapFileMajorVersion = getShrinkwrapFileMajorVersion(lockfileVersion);
  if (packages && shrinkwrapFileMajorVersion === 6) {
    const updatedPackages: Lockfile['packages'] = {};
    for (const [dependencyPath, dependency] of Object.entries(packages)) {
      updatedPackages[convertLockfileV6DepPathToV5DepPath(dependencyPath)] = dependency;
    }
    doc.packages = updatedPackages;
  }
  return doc;
}
