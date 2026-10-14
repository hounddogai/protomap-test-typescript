/**
 * The default challenge manifest records of loyaltyhub's challenge work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a default challenge manifest is in its life cycle. */
export type DefaultChallengeManifestStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a default challenge manifest and its current status. */
export class DefaultChallengeManifest {
  code: string;
  label: string;
  audienceId: string;
  ceiling: number;
  externalRef: string;
  status: DefaultChallengeManifestStatus;

  constructor(
    code: string,
    label: string,
    audienceId: string,
    ceiling: number,
    externalRef: string,
    status: DefaultChallengeManifestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.audienceId = audienceId;
    this.ceiling = ceiling;
    this.externalRef = externalRef;
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

  canMoveTo(next: DefaultChallengeManifestStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready";
      case "warming":
        return next === "draining";
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

  moveTo(next: DefaultChallengeManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default challenge manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  measuredValue(): number {
    return this.ceiling;
  }

  copy(): DefaultChallengeManifest {
    return new DefaultChallengeManifest(
      this.code,
      this.label,
      this.audienceId,
      this.ceiling,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a default challenge manifest in status idle. */
export function newDefaultChallengeManifest(code: string, label: string): DefaultChallengeManifest {
  return new DefaultChallengeManifest(code, label, "", 0, "", "idle");
}
