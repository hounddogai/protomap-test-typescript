import * as text from "../../../../kit/text.js";

/** Where a weighted post assignment is in its life cycle. */
export type WeightedPostAssignmentStatus = "requested" | "granted" | "revoked" | "expired";

/** One weighted post assignment, with what the planners need to act on it. */
export class WeightedPostAssignment {
  code: string;
  title: string;
  revision: number;
  startsAt: number;
  country: string;
  maximum: number;
  channel: string;
  status: WeightedPostAssignmentStatus;

  constructor(
    code: string,
    title: string,
    revision: number,
    startsAt: number,
    country: string,
    maximum: number,
    channel: string,
    status: WeightedPostAssignmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.revision = revision;
    this.startsAt = startsAt;
    this.country = country;
    this.maximum = maximum;
    this.channel = channel;
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

  canMoveTo(next: WeightedPostAssignmentStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedPostAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted post assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  effectiveTotal(): number {
    return Math.round((this.revision + this.startsAt) * 100) / 100;
  }

  copy(): WeightedPostAssignment {
    return new WeightedPostAssignment(
      this.code,
      this.title,
      this.revision,
      this.startsAt,
      this.country,
      this.maximum,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a weighted post assignment in status requested. */
export function newWeightedPostAssignment(code: string, title: string): WeightedPostAssignment {
  return new WeightedPostAssignment(code, title, 0, 0, "", 0, "", "requested");
}
