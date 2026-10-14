import * as text from "../../../../kit/text.js";

/** Where a post assignment is in its life cycle. */
export type PostAssignmentStatus = "created" | "validated" | "published" | "retired";

/** A post assignment. Its code is unique within a tenant. */
export class PostAssignment {
  code: string;
  title: string;
  startsAt: number;
  country: string;
  threshold: number;
  status: PostAssignmentStatus;

  constructor(
    code: string,
    title: string,
    startsAt: number,
    country: string,
    threshold: number,
    status: PostAssignmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.startsAt = startsAt;
    this.country = country;
    this.threshold = threshold;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PostAssignmentStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: PostAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`post assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"post assignment"} ${this.code}`;
  }

  weightedValue(): number {
    return Math.round((this.threshold - this.startsAt) * 100) / 100;
  }

  copy(): PostAssignment {
    return new PostAssignment(this.code, this.title, this.startsAt, this.country, this.threshold, this.status);
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a post assignment in status created. */
export function newPostAssignment(code: string, title: string): PostAssignment {
  return new PostAssignment(code, title, 0, "", 0, "created");
}
