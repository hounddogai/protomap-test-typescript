/**
 * The complaint mapping records of deliverability's complaint work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a complaint mapping is in its life cycle. */
export type ComplaintMappingStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A complaint mapping. Its code is unique within a tenant. */
export class ComplaintMapping {
  code: string;
  name: string;
  threshold: number;
  version: number;
  floorValue: number;
  attributes: Map<string, string>;
  summary: string;
  cohort: string;
  createdAt: number;
  bid: number;
  status: ComplaintMappingStatus;

  constructor(
    code: string,
    name: string,
    threshold: number,
    version: number,
    floorValue: number,
    attributes: Map<string, string>,
    summary: string,
    cohort: string,
    createdAt: number,
    bid: number,
    status: ComplaintMappingStatus,
  ) {
    this.code = code;
    this.name = name;
    this.threshold = threshold;
    this.version = version;
    this.floorValue = floorValue;
    this.attributes = attributes;
    this.summary = summary;
    this.cohort = cohort;
    this.createdAt = createdAt;
    this.bid = bid;
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

  canMoveTo(next: ComplaintMappingStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended" || next === "closed";
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
        return next === "closed";
    }
    return false;
  }

  moveTo(next: ComplaintMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`complaint mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveVolume(): number {
    return Math.round((this.createdAt + this.threshold) * 100) / 100;
  }

  copy(): ComplaintMapping {
    return new ComplaintMapping(
      this.code,
      this.name,
      this.threshold,
      this.version,
      this.floorValue,
      this.attributes,
      this.summary,
      this.cohort,
      this.createdAt,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a complaint mapping in status draft. */
export function newComplaintMapping(code: string, name: string): ComplaintMapping {
  return new ComplaintMapping(code, name, 0, 0, 0, new Map<string, string>(), "", "", 0, 0, "draft");
}
