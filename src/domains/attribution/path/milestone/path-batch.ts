import * as text from "../../../../kit/text.js";

/** Where a path batch is in its life cycle. */
export type PathBatchStatus = "created" | "validated" | "published" | "retired";

/** A path batch as the path team keeps it. */
export class PathBatch {
  code: string;
  label: string;
  region: string;
  ratio: number;
  amount: number;
  retries: number;
  bid: number;
  attributes: Map<string, string>;
  frequencyCap: number;
  source: string;
  campaignRef: string;
  status: PathBatchStatus;

  constructor(
    code: string,
    label: string,
    region: string,
    ratio: number,
    amount: number,
    retries: number,
    bid: number,
    attributes: Map<string, string>,
    frequencyCap: number,
    source: string,
    campaignRef: string,
    status: PathBatchStatus,
  ) {
    this.code = code;
    this.label = label;
    this.region = region;
    this.ratio = ratio;
    this.amount = amount;
    this.retries = retries;
    this.bid = bid;
    this.attributes = attributes;
    this.frequencyCap = frequencyCap;
    this.source = source;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: PathBatchStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: PathBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`path batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedTotal(): number {
    return Math.round(this.retries * this.frequencyCap * 100) / 100;
  }

  copy(): PathBatch {
    return new PathBatch(
      this.code,
      this.label,
      this.region,
      this.ratio,
      this.amount,
      this.retries,
      this.bid,
      this.attributes,
      this.frequencyCap,
      this.source,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a path batch in status created. */
export function newPathBatch(code: string, label: string): PathBatch {
  return new PathBatch(code, label, "", 0, 0, 0, 0, new Map<string, string>(), 0, "", "", "created");
}
