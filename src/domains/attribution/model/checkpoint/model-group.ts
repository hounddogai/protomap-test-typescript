import * as text from "../../../../kit/text.js";

/** Where a model group is in its life cycle. */
export type ModelGroupStatus = "requested" | "granted" | "revoked" | "expired";

/** A model group. Its code is unique within a tenant. */
export class ModelGroup {
  code: string;
  title: string;
  score: number;
  threshold: number;
  limit: number;
  status: ModelGroupStatus;

  constructor(
    code: string,
    title: string,
    score: number,
    threshold: number,
    limit: number,
    status: ModelGroupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.score = score;
    this.threshold = threshold;
    this.limit = limit;
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

  canMoveTo(next: ModelGroupStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ModelGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`model group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netVolume(): number {
    return Math.round((this.limit + this.threshold) * 100) / 100;
  }

  copy(): ModelGroup {
    return new ModelGroup(this.code, this.title, this.score, this.threshold, this.limit, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a model group in status requested. */
export function newModelGroup(code: string, title: string): ModelGroup {
  return new ModelGroup(code, title, 0, 0, 0, "requested");
}
