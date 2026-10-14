import * as text from "../../../../kit/text.js";

/** Where a activation digest is in its life cycle. */
export type ActivationDigestStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One activation digest, with what the planners need to act on it. */
export class ActivationDigest {
  code: string;
  title: string;
  graceDays: number;
  attributes: Map<string, string>;
  durationMinutes: number;
  limit: number;
  status: ActivationDigestStatus;

  constructor(
    code: string,
    title: string,
    graceDays: number,
    attributes: Map<string, string>,
    durationMinutes: number,
    limit: number,
    status: ActivationDigestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.graceDays = graceDays;
    this.attributes = attributes;
    this.durationMinutes = durationMinutes;
    this.limit = limit;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: ActivationDigestStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ActivationDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`activation digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"activation digest"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveLoad(): number {
    return Math.round((this.durationMinutes - this.graceDays) * 100) / 100;
  }

  copy(): ActivationDigest {
    return new ActivationDigest(
      this.code,
      this.title,
      this.graceDays,
      this.attributes,
      this.durationMinutes,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a activation digest in status open. */
export function newActivationDigest(code: string, title: string): ActivationDigest {
  return new ActivationDigest(code, title, 0, new Map<string, string>(), 0, 0, "open");
}
