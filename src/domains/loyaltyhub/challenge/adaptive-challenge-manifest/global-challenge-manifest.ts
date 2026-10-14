/**
 * The global challenge manifest records of loyaltyhub's challenge work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global challenge manifest is in its life cycle. */
export type GlobalChallengeManifestStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a global challenge manifest and its current status. */
export class GlobalChallengeManifest {
  code: string;
  label: string;
  description: string;
  name: string;
  minimum: number;
  summary: string;
  status: GlobalChallengeManifestStatus;

  constructor(
    code: string,
    label: string,
    description: string,
    name: string,
    minimum: number,
    summary: string,
    status: GlobalChallengeManifestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.description = description;
    this.name = name;
    this.minimum = minimum;
    this.summary = summary;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalChallengeManifestStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalChallengeManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global challenge manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"global challenge manifest"} ${this.code}`;
  }

  measuredValue(): number {
    return this.minimum;
  }

  copy(): GlobalChallengeManifest {
    return new GlobalChallengeManifest(
      this.code,
      this.label,
      this.description,
      this.name,
      this.minimum,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a global challenge manifest in status idle. */
export function newGlobalChallengeManifest(code: string, label: string): GlobalChallengeManifest {
  return new GlobalChallengeManifest(code, label, "", "", 0, "", "idle");
}
