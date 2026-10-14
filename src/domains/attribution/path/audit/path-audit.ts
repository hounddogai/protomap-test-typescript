/**
 * The path audit records of attribution's path work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a path audit is in its life cycle. */
export type PathAuditStatus = "created" | "validated" | "published" | "retired";

/** The record of a path audit and its current status. */
export class PathAudit {
  code: string;
  title: string;
  threshold: number;
  ownerId: string;
  version: number;
  limit: number;
  margin: number;
  maximum: number;
  ratio: number;
  checksum: string;
  status: PathAuditStatus;

  constructor(
    code: string,
    title: string,
    threshold: number,
    ownerId: string,
    version: number,
    limit: number,
    margin: number,
    maximum: number,
    ratio: number,
    checksum: string,
    status: PathAuditStatus,
  ) {
    this.code = code;
    this.title = title;
    this.threshold = threshold;
    this.ownerId = ownerId;
    this.version = version;
    this.limit = limit;
    this.margin = margin;
    this.maximum = maximum;
    this.ratio = ratio;
    this.checksum = checksum;
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

  canMoveTo(next: PathAuditStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
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

  moveTo(next: PathAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`path audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  weightedValue(): number {
    return Math.round((this.margin + this.ratio) * 100) / 100;
  }

  copy(): PathAudit {
    return new PathAudit(
      this.code,
      this.title,
      this.threshold,
      this.ownerId,
      this.version,
      this.limit,
      this.margin,
      this.maximum,
      this.ratio,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a path audit in status created. */
export function newPathAudit(code: string, title: string): PathAudit {
  return new PathAudit(code, title, 0, "", 0, 0, 0, 0, 0, "", "created");
}
