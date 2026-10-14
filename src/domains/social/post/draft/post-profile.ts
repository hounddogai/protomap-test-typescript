import * as text from "../../../../kit/text.js";

/** Where a post profile is in its life cycle. */
export type PostProfileStatus = "requested" | "granted" | "revoked" | "expired";

/** One post profile, with what the planners need to act on it. */
export class PostProfile {
  code: string;
  label: string;
  pinned: boolean;
  minimum: number;
  attempts: number;
  status: PostProfileStatus;

  constructor(
    code: string,
    label: string,
    pinned: boolean,
    minimum: number,
    attempts: number,
    status: PostProfileStatus,
  ) {
    this.code = code;
    this.label = label;
    this.pinned = pinned;
    this.minimum = minimum;
    this.attempts = attempts;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PostProfileStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PostProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`post profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveLoad(): number {
    return Math.round((this.attempts - this.minimum) * 100) / 100;
  }

  copy(): PostProfile {
    return new PostProfile(this.code, this.label, this.pinned, this.minimum, this.attempts, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a post profile in status requested. */
export function newPostProfile(code: string, label: string): PostProfile {
  return new PostProfile(code, label, false, 0, 0, "requested");
}
