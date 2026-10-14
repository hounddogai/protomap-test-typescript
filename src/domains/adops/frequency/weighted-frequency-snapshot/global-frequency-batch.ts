import * as text from "../../../../kit/text.js";

/** Where a global frequency batch is in its life cycle. */
export type GlobalFrequencyBatchStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One global frequency batch, with what the planners need to act on it. */
export class GlobalFrequencyBatch {
  code: string;
  name: string;
  sequence: number;
  openRate: number;
  utmSource: string;
  tags: string[];
  status: GlobalFrequencyBatchStatus;

  constructor(
    code: string,
    name: string,
    sequence: number,
    openRate: number,
    utmSource: string,
    tags: string[],
    status: GlobalFrequencyBatchStatus,
  ) {
    this.code = code;
    this.name = name;
    this.sequence = sequence;
    this.openRate = openRate;
    this.utmSource = utmSource;
    this.tags = tags;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalFrequencyBatchStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalFrequencyBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global frequency batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedValue(): number {
    return Math.round((this.sequence - this.openRate) * 100) / 100;
  }

  copy(): GlobalFrequencyBatch {
    return new GlobalFrequencyBatch(
      this.code,
      this.name,
      this.sequence,
      this.openRate,
      this.utmSource,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a global frequency batch in status draft. */
export function newGlobalFrequencyBatch(code: string, name: string): GlobalFrequencyBatch {
  return new GlobalFrequencyBatch(code, name, 0, 0, "", [], "draft");
}
