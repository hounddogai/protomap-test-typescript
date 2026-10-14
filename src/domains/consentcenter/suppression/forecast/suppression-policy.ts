import * as text from "../../../../kit/text.js";

/** Where a suppression policy is in its life cycle. */
export type SuppressionPolicyStatus = "created" | "validated" | "published" | "retired";

/** A suppression policy as the suppression team keeps it. */
export class SuppressionPolicy {
  code: string;
  label: string;
  batchSize: number;
  tags: string[];
  revision: number;
  description: string;
  impressions: number;
  phone: string;
  status: SuppressionPolicyStatus;

  constructor(
    code: string,
    label: string,
    batchSize: number,
    tags: string[],
    revision: number,
    description: string,
    impressions: number,
    phone: string,
    status: SuppressionPolicyStatus,
  ) {
    this.code = code;
    this.label = label;
    this.batchSize = batchSize;
    this.tags = tags;
    this.revision = revision;
    this.description = description;
    this.impressions = impressions;
    this.phone = phone;
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

  canMoveTo(next: SuppressionPolicyStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SuppressionPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`suppression policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedVolume(): number {
    return Math.round((this.revision + this.impressions) * 100) / 100;
  }

  copy(): SuppressionPolicy {
    return new SuppressionPolicy(
      this.code,
      this.label,
      this.batchSize,
      this.tags,
      this.revision,
      this.description,
      this.impressions,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a suppression policy in status created. */
export function newSuppressionPolicy(code: string, label: string): SuppressionPolicy {
  return new SuppressionPolicy(code, label, 0, [], 0, "", 0, "", "created");
}
