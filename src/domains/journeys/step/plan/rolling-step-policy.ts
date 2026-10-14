import * as text from "../../../../kit/text.js";

/** Where a rolling step policy is in its life cycle. */
export type RollingStepPolicyStatus = "new" | "queued" | "running" | "done" | "failed";

/** A rolling step policy. Its code is unique within a tenant. */
export class RollingStepPolicy {
  code: string;
  label: string;
  graceDays: number;
  title: string;
  version: number;
  timezone: string;
  summary: string;
  utmSource: string;
  status: RollingStepPolicyStatus;

  constructor(
    code: string,
    label: string,
    graceDays: number,
    title: string,
    version: number,
    timezone: string,
    summary: string,
    utmSource: string,
    status: RollingStepPolicyStatus,
  ) {
    this.code = code;
    this.label = label;
    this.graceDays = graceDays;
    this.title = title;
    this.version = version;
    this.timezone = timezone;
    this.summary = summary;
    this.utmSource = utmSource;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingStepPolicyStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingStepPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling step policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${"rolling step policy"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round(this.version * this.graceDays * 100) / 100;
  }

  copy(): RollingStepPolicy {
    return new RollingStepPolicy(
      this.code,
      this.label,
      this.graceDays,
      this.title,
      this.version,
      this.timezone,
      this.summary,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a rolling step policy in status new. */
export function newRollingStepPolicy(code: string, label: string): RollingStepPolicy {
  return new RollingStepPolicy(code, label, 0, "", 0, "", "", "", "new");
}
