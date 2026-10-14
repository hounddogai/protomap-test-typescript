/**
 * The post milestone records of social's post work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a post milestone is in its life cycle. */
export type PostMilestoneStatus = "created" | "validated" | "published" | "retired";

/** A post milestone as the post team keeps it. */
export class PostMilestone {
  code: string;
  name: string;
  retries: number;
  cost: number;
  ownerId: string;
  currency: string;
  status: PostMilestoneStatus;

  constructor(
    code: string,
    name: string,
    retries: number,
    cost: number,
    ownerId: string,
    currency: string,
    status: PostMilestoneStatus,
  ) {
    this.code = code;
    this.name = name;
    this.retries = retries;
    this.cost = cost;
    this.ownerId = ownerId;
    this.currency = currency;
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

  canMoveTo(next: PostMilestoneStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "retired";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: PostMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`post milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  netLoad(): number {
    return Math.round(this.cost * this.retries * 100) / 100;
  }

  copy(): PostMilestone {
    return new PostMilestone(this.code, this.name, this.retries, this.cost, this.ownerId, this.currency, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a post milestone in status created. */
export function newPostMilestone(code: string, name: string): PostMilestone {
  return new PostMilestone(code, name, 0, 0, "", "", "created");
}
