/**
 * The path policy records of attribution's path work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a path policy is in its life cycle. */
export type PathPolicyStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A path policy as the path team keeps it. */
export class PathPolicy {
  code: string;
  title: string;
  source: string;
  retries: number;
  quantity: number;
  segment: string;
  summary: string;
  sequence: number;
  visible: boolean;
  frequencyCap: number;
  status: PathPolicyStatus;

  constructor(
    code: string,
    title: string,
    source: string,
    retries: number,
    quantity: number,
    segment: string,
    summary: string,
    sequence: number,
    visible: boolean,
    frequencyCap: number,
    status: PathPolicyStatus,
  ) {
    this.code = code;
    this.title = title;
    this.source = source;
    this.retries = retries;
    this.quantity = quantity;
    this.segment = segment;
    this.summary = summary;
    this.sequence = sequence;
    this.visible = visible;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: PathPolicyStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: PathPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`path policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  effectiveLoad(): number {
    return Math.round((this.sequence + this.quantity) * 100) / 100;
  }

  copy(): PathPolicy {
    return new PathPolicy(
      this.code,
      this.title,
      this.source,
      this.retries,
      this.quantity,
      this.segment,
      this.summary,
      this.sequence,
      this.visible,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a path policy in status draft. */
export function newPathPolicy(code: string, title: string): PathPolicy {
  return new PathPolicy(code, title, "", 0, 0, "", "", 0, false, 0, "draft");
}
