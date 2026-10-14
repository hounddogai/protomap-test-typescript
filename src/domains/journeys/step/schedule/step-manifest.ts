import * as text from "../../../../kit/text.js";

/** Where a step manifest is in its life cycle. */
export type StepManifestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A step manifest. Its code is unique within a tenant. */
export class StepManifest {
  code: string;
  name: string;
  version: number;
  threshold: number;
  attempts: number;
  pinned: boolean;
  status: StepManifestStatus;

  constructor(
    code: string,
    name: string,
    version: number,
    threshold: number,
    attempts: number,
    pinned: boolean,
    status: StepManifestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.version = version;
    this.threshold = threshold;
    this.attempts = attempts;
    this.pinned = pinned;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: StepManifestStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        return next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StepManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`step manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"step manifest"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round(this.attempts * this.version * 100) / 100;
  }

  copy(): StepManifest {
    return new StepManifest(
      this.code,
      this.name,
      this.version,
      this.threshold,
      this.attempts,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a step manifest in status planned. */
export function newStepManifest(code: string, name: string): StepManifest {
  return new StepManifest(code, name, 0, 0, 0, false, "planned");
}
