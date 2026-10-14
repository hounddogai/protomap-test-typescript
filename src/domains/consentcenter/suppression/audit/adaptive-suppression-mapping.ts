import * as text from "../../../../kit/text.js";

/** Where a adaptive suppression mapping is in its life cycle. */
export type AdaptiveSuppressionMappingStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One adaptive suppression mapping, with what the planners need to act on it. */
export class AdaptiveSuppressionMapping {
  code: string;
  name: string;
  cost: number;
  checksum: string;
  weight: number;
  status: AdaptiveSuppressionMappingStatus;

  constructor(
    code: string,
    name: string,
    cost: number,
    checksum: string,
    weight: number,
    status: AdaptiveSuppressionMappingStatus,
  ) {
    this.code = code;
    this.name = name;
    this.cost = cost;
    this.checksum = checksum;
    this.weight = weight;
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

  canMoveTo(next: AdaptiveSuppressionMappingStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveSuppressionMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive suppression mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"adaptive suppression mapping"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round((this.cost - this.weight) * 100) / 100;
  }

  copy(): AdaptiveSuppressionMapping {
    return new AdaptiveSuppressionMapping(this.code, this.name, this.cost, this.checksum, this.weight, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a adaptive suppression mapping in status draft. */
export function newAdaptiveSuppressionMapping(code: string, name: string): AdaptiveSuppressionMapping {
  return new AdaptiveSuppressionMapping(code, name, 0, "", 0, "draft");
}
