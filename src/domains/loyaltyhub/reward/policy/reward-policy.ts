/**
 * The reward policy records of loyaltyhub's reward work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a reward policy is in its life cycle. */
export type RewardPolicyStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a reward policy and its current status. */
export class RewardPolicy {
  code: string;
  name: string;
  externalRef: string;
  createdAt: number;
  journeyId: string;
  rate: number;
  sendAt: number;
  title: string;
  visible: boolean;
  summary: string;
  status: RewardPolicyStatus;

  constructor(
    code: string,
    name: string,
    externalRef: string,
    createdAt: number,
    journeyId: string,
    rate: number,
    sendAt: number,
    title: string,
    visible: boolean,
    summary: string,
    status: RewardPolicyStatus,
  ) {
    this.code = code;
    this.name = name;
    this.externalRef = externalRef;
    this.createdAt = createdAt;
    this.journeyId = journeyId;
    this.rate = rate;
    this.sendAt = sendAt;
    this.title = title;
    this.visible = visible;
    this.summary = summary;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: RewardPolicyStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
            return true;
        }
        return false;
      case "warming":
        return next === "stopped";
      case "ready":
        return next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RewardPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedLoad(): number {
    return Math.round((this.sendAt - this.createdAt) * 100) / 100;
  }

  copy(): RewardPolicy {
    return new RewardPolicy(
      this.code,
      this.name,
      this.externalRef,
      this.createdAt,
      this.journeyId,
      this.rate,
      this.sendAt,
      this.title,
      this.visible,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a reward policy in status idle. */
export function newRewardPolicy(code: string, name: string): RewardPolicy {
  return new RewardPolicy(code, name, "", 0, "", 0, 0, "", false, "", "idle");
}
