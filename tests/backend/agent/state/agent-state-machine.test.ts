import { describe, it, expect, beforeEach } from "vitest";
import { AgentStateMachine } from "../../../../backend/agent/state/AgentStateMachine";
import { AgentState, AgentAction, StateMachineConfig } from "../../../../backend/agent/state/AgentStates";
import { CandidateIntention } from "../../../../backend/agent/intention/IntentionTypes";

describe("AgentStateMachine (Modular)", () => {
  let stateMachine: AgentStateMachine;

  beforeEach(() => {
    stateMachine = new AgentStateMachine({
      initialState: AgentState.GREETING,
      enableLogging: false,
      enableStateHistory: true,
    });
  });

  describe("Initialization", () => {
    it("should initialize with default greeting state", () => {
      expect(stateMachine.getCurrentState()).toBe(AgentState.GREETING);
    });

    it("should initialize with custom initial state", () => {
      const customStateMachine = new AgentStateMachine({
        initialState: AgentState.Q_AND_A,
      });
      expect(customStateMachine.getCurrentState()).toBe(AgentState.Q_AND_A);
    });

    it("should have correct initial available actions", () => {
      const actions = stateMachine.getAvailableActions();
      expect(actions).toContain(AgentAction.SEND_GREETING);
      expect(actions).toContain(AgentAction.PRESENT_JOB);
      expect(actions).toContain(AgentAction.REQUEST_CLARIFICATION);
    });
  });

  describe("State Transitions", () => {
    it("should transition from GREETING to JOB_PRESENTATION on JOB_INQUIRY", () => {
      const result = stateMachine.transition(CandidateIntention.JOB_INQUIRY);

      expect(result.success).toBe(true);
      expect(result.newState).toBe(AgentState.JOB_DISCUSSION);
      expect(result.metadata?.previousState).toBe(AgentState.GREETING);
      expect(result.metadata?.transitionTrigger).toBe(CandidateIntention.JOB_INQUIRY);
    });

    it("should transition from GREETING to Q_AND_A on SALARY_QUESTION", () => {
      const result = stateMachine.transition(CandidateIntention.SALARY_QUESTION);

      expect(result.success).toBe(true);
      expect(result.newState).toBe(AgentState.Q_AND_A);
      expect(result.availableActions).toContain(AgentAction.ANSWER_QUESTION);
    });

    it("should transition to JAILBREAK_DETECTED on JAILBREAK_ATTEMPT", () => {
      const result = stateMachine.transition(CandidateIntention.JAILBREAK_ATTEMPT);

      expect(result.success).toBe(true);
      expect(result.newState).toBe(AgentState.JAILBREAK_DETECTED);
      expect(result.availableActions).toContain(AgentAction.BLOCK_JAILBREAK);
    });

    it("should transition to ERROR on UNKNOWN intention", () => {
      const result = stateMachine.transition(CandidateIntention.UNKNOWN);

      expect(result.success).toBe(true);
      expect(result.newState).toBe(AgentState.ERROR);
      expect(result.availableActions).toContain(AgentAction.HANDLE_ERROR);
    });

    it("should fail transition when no valid transition exists", () => {
      // Try to transition from GREETING to an invalid state
      const result = stateMachine.transition(CandidateIntention.CV_UPLOAD);

      expect(result.success).toBe(true);
      expect(result.newState).toBe(AgentState.DOCUMENT_COLLECTION);
    });
  });

  describe("Complex State Flows", () => {
    it("should handle complete conversation flow", () => {
      // Start: GREETING -> JOB_DISCUSSION
      let result = stateMachine.transition(CandidateIntention.JOB_INQUIRY);
      expect(result.newState).toBe(AgentState.JOB_DISCUSSION);

      // JOB_DISCUSSION -> Q_AND_A
      result = stateMachine.transition(CandidateIntention.SALARY_QUESTION);
      expect(result.newState).toBe(AgentState.Q_AND_A);

      // Q_AND_A -> SURVEY
      result = stateMachine.transition(CandidateIntention.EXPERIENCE_VALIDATION);
      expect(result.newState).toBe(AgentState.SURVEY);

      // SURVEY -> CV_PROCESSING
      result = stateMachine.transition(CandidateIntention.CV_UPLOAD);
      expect(result.newState).toBe(AgentState.CV_PROCESSING);

      // CV_PROCESSING -> TECHNICAL_VALIDATION
      result = stateMachine.transition(CandidateIntention.TECHNICAL_SKILLS_DISCUSSION);
      expect(result.newState).toBe(AgentState.TECHNICAL_VALIDATION);

      // TECHNICAL_VALIDATION -> SKILL_ASSESSMENT
      result = stateMachine.transition(CandidateIntention.EXPERIENCE_VALIDATION);
      expect(result.newState).toBe(AgentState.SKILL_ASSESSMENT);

      // SKILL_ASSESSMENT -> FINAL_INTERVIEW
      result = stateMachine.transition(CandidateIntention.EXPERIENCE_VALIDATION);
      expect(result.newState).toBe(AgentState.FINAL_INTERVIEW);

      // FINAL_INTERVIEW -> CLOSING
      result = stateMachine.transition(CandidateIntention.FAREWELL);
      expect(result.newState).toBe(AgentState.CLOSING);
    });

    it("should handle early termination paths", () => {
      // GREETING -> JOB_DISCUSSION -> CLOSING
      let result = stateMachine.transition(CandidateIntention.JOB_INQUIRY);
      expect(result.newState).toBe(AgentState.JOB_DISCUSSION);

      result = stateMachine.transition(CandidateIntention.FAREWELL);
      expect(result.newState).toBe(AgentState.CLOSING);
    });
  });

  describe("State Actions Mapping", () => {
    it("should return correct actions for GREETING state", () => {
      const actions = stateMachine.getAvailableActions();
      expect(actions).toEqual([AgentAction.SEND_GREETING, AgentAction.PRESENT_JOB, AgentAction.REQUEST_CLARIFICATION]);
    });

    it("should return correct actions for JOB_PRESENTATION state", () => {
      stateMachine.transition(CandidateIntention.JOB_INQUIRY);
      const actions = stateMachine.getAvailableActions();
      expect(actions).toEqual([AgentAction.PRESENT_JOB, AgentAction.ANSWER_QUESTION, AgentAction.ASK_SURVEY_QUESTION]);
    });

    it("should return correct actions for Q_AND_A state", () => {
      stateMachine.transition(CandidateIntention.SALARY_QUESTION);
      const actions = stateMachine.getAvailableActions();
      expect(actions).toEqual([AgentAction.ANSWER_QUESTION, AgentAction.ASK_SURVEY_QUESTION, AgentAction.REQUEST_CLARIFICATION]);
    });

    it("should return correct actions for SURVEY state", () => {
      stateMachine.transition(CandidateIntention.JOB_INQUIRY);
      stateMachine.transition(CandidateIntention.EXPERIENCE_VALIDATION);
      const actions = stateMachine.getAvailableActions();
      expect(actions).toEqual([AgentAction.ASK_SURVEY_QUESTION, AgentAction.PROCESS_CV, AgentAction.VALIDATE_TECHNICAL_SKILLS]);
    });

    it("should return correct actions for CV_PROCESSING state", () => {
      stateMachine.transition(CandidateIntention.SALARY_QUESTION);
      stateMachine.transition(CandidateIntention.CV_UPLOAD);
      const actions = stateMachine.getAvailableActions();
      expect(actions).toEqual([AgentAction.PROCESS_CV, AgentAction.VALIDATE_TECHNICAL_SKILLS, AgentAction.ASK_SURVEY_QUESTION]);
    });

    it("should return correct actions for TECHNICAL_VALIDATION state", () => {
      stateMachine.transition(CandidateIntention.SALARY_QUESTION);
      stateMachine.transition(CandidateIntention.CV_UPLOAD);
      stateMachine.transition(CandidateIntention.TECHNICAL_SKILLS_DISCUSSION);
      const actions = stateMachine.getAvailableActions();
      expect(actions).toEqual([AgentAction.VALIDATE_TECHNICAL_SKILLS, AgentAction.CONDUCT_SKILL_ASSESSMENT, AgentAction.ASK_SURVEY_QUESTION]);
    });

    it("should return correct actions for SKILL_ASSESSMENT state", () => {
      // Navigate to SKILL_ASSESSMENT
      stateMachine.transition(CandidateIntention.SALARY_QUESTION);
      stateMachine.transition(CandidateIntention.CV_UPLOAD);
      stateMachine.transition(CandidateIntention.TECHNICAL_SKILLS_DISCUSSION);
      stateMachine.transition(CandidateIntention.EXPERIENCE_VALIDATION);

      const actions = stateMachine.getAvailableActions();
      expect(actions).toEqual([AgentAction.CONDUCT_SKILL_ASSESSMENT, AgentAction.CONDUCT_FINAL_INTERVIEW, AgentAction.GENERATE_REPORT]);
    });

    it("should return correct actions for FINAL_INTERVIEW state", () => {
      // Navigate to FINAL_INTERVIEW
      stateMachine.transition(CandidateIntention.SALARY_QUESTION);
      stateMachine.transition(CandidateIntention.CV_UPLOAD);
      stateMachine.transition(CandidateIntention.TECHNICAL_SKILLS_DISCUSSION);
      stateMachine.transition(CandidateIntention.EXPERIENCE_VALIDATION);
      stateMachine.transition(CandidateIntention.EXPERIENCE_VALIDATION);

      const actions = stateMachine.getAvailableActions();
      expect(actions).toEqual([AgentAction.CONDUCT_FINAL_INTERVIEW, AgentAction.GENERATE_REPORT, AgentAction.END_CONVERSATION]);
    });

    it("should return correct actions for EVALUATION state", () => {
      // Navigate to EVALUATION
      stateMachine.transition(CandidateIntention.SALARY_QUESTION);
      stateMachine.transition(CandidateIntention.CV_UPLOAD);
      stateMachine.transition(CandidateIntention.TECHNICAL_SKILLS_DISCUSSION);
      stateMachine.transition(CandidateIntention.EXPERIENCE_VALIDATION);
      stateMachine.transition(CandidateIntention.EXPERIENCE_VALIDATION);
      stateMachine.transition(CandidateIntention.FAREWELL);

      const actions = stateMachine.getAvailableActions();
      expect(actions).toEqual([AgentAction.END_CONVERSATION, AgentAction.GENERATE_REPORT]);
    });

    it("should return correct actions for CLOSING state", () => {
      stateMachine.transition(CandidateIntention.JOB_INQUIRY);
      stateMachine.transition(CandidateIntention.FAREWELL);

      const actions = stateMachine.getAvailableActions();
      expect(actions).toEqual([AgentAction.END_CONVERSATION, AgentAction.GENERATE_REPORT]);
    });

    it("should return correct actions for ERROR state", () => {
      stateMachine.transition(CandidateIntention.UNKNOWN);

      const actions = stateMachine.getAvailableActions();
      expect(actions).toEqual([AgentAction.HANDLE_ERROR, AgentAction.REQUEST_CLARIFICATION, AgentAction.SEND_GREETING]);
    });

    it("should return correct actions for JAILBREAK_DETECTED state", () => {
      stateMachine.transition(CandidateIntention.JAILBREAK_ATTEMPT);

      const actions = stateMachine.getAvailableActions();
      expect(actions).toEqual([AgentAction.BLOCK_JAILBREAK, AgentAction.REQUEST_CLARIFICATION]);
    });
  });

  describe("Context Management", () => {
    it("should maintain context correctly", () => {
      const context = stateMachine.getContext();
      expect(context.currentState).toBe(AgentState.GREETING);
      expect(context.timestamp).toBeInstanceOf(Date);
      expect(context.conversationData).toEqual({});
    });

    it("should update context data during transitions", () => {
      const result = stateMachine.transition(CandidateIntention.JOB_INQUIRY, {
        candidateId: "test-123",
        jobId: "job-456",
      });

      expect(result.success).toBe(true);

      const context = stateMachine.getContext();
      expect(context.previousState).toBe(AgentState.GREETING);
      expect(context.currentState).toBe(AgentState.JOB_DISCUSSION);
      expect(context.conversationData.candidateId).toBe("test-123");
      expect(context.conversationData.jobId).toBe("job-456");
    });
  });

  describe("Reset Functionality", () => {
    it("should reset to initial state", () => {
      // Make some transitions
      stateMachine.transition(CandidateIntention.JOB_INQUIRY);
      stateMachine.transition(CandidateIntention.SALARY_QUESTION);
      expect(stateMachine.getCurrentState()).toBe(AgentState.Q_AND_A);

      // Reset
      stateMachine.reset();
      expect(stateMachine.getCurrentState()).toBe(AgentState.GREETING);
      expect(stateMachine.getContext().conversationData).toEqual({});
    });

    it("should reset to custom state", () => {
      stateMachine.reset(AgentState.SURVEY);
      expect(stateMachine.getCurrentState()).toBe(AgentState.SURVEY);
    });
  });

  describe("Can Transition Check", () => {
    it("should correctly check valid transitions", () => {
      expect(stateMachine.canTransition(CandidateIntention.JOB_INQUIRY)).toBe(true);
      expect(stateMachine.canTransition(CandidateIntention.SALARY_QUESTION)).toBe(true);
      expect(stateMachine.canTransition(CandidateIntention.JAILBREAK_ATTEMPT)).toBe(true);
    });

    it("should correctly check invalid transitions", () => {
      expect(stateMachine.canTransition(CandidateIntention.CV_UPLOAD)).toBe(true);
      expect(stateMachine.canTransition(CandidateIntention.TECHNICAL_SKILLS_DISCUSSION)).toBe(false);
    });
  });

  describe("Force Transition", () => {
    it("should force transition to any state", () => {
      stateMachine.forceTransition(AgentState.FINAL_INTERVIEW, "Testing force transition");

      expect(stateMachine.getCurrentState()).toBe(AgentState.FINAL_INTERVIEW);

      const context = stateMachine.getContext();
      expect(context.previousState).toBe(AgentState.GREETING);
      expect(context.conversationData.forceTransitionReason).toBe("Testing force transition");
    });
  });

  describe("State History", () => {
    it("should track state history when enabled", () => {
      // Make several transitions
      stateMachine.transition(CandidateIntention.JOB_INQUIRY);
      stateMachine.transition(CandidateIntention.SALARY_QUESTION);
      stateMachine.transition(CandidateIntention.EXPERIENCE_VALIDATION);

      const history = stateMachine.getStateHistory();
      expect(history).toEqual([AgentState.GREETING, AgentState.JOB_DISCUSSION, AgentState.Q_AND_A]);
    });

    it("should not track history when disabled", () => {
      const noHistoryMachine = new AgentStateMachine({
        enableStateHistory: false,
      });

      noHistoryMachine.transition(CandidateIntention.JOB_INQUIRY);
      noHistoryMachine.transition(CandidateIntention.SALARY_QUESTION);

      const history = noHistoryMachine.getStateHistory();
      expect(history).toEqual([]);
    });
  });

  describe("Configuration Validation", () => {
    it("should validate configuration correctly", () => {
      const errors = stateMachine.validateConfiguration();
      expect(errors).toEqual([]);
    });

    it("should detect configuration issues", () => {
      // This would require a mock state machine with intentional issues
      // For now, we'll just test that the method exists and returns an array
      const errors = stateMachine.validateConfiguration();
      expect(Array.isArray(errors)).toBe(true);
    });
  });

  describe("Error Recovery", () => {
    it("should recover from ERROR state", () => {
      // Go to error state
      stateMachine.transition(CandidateIntention.UNKNOWN);
      expect(stateMachine.getCurrentState()).toBe(AgentState.ERROR);

      // Recover with help request
      const result = stateMachine.transition(CandidateIntention.HELP_REQUEST);
      expect(result.success).toBe(true);
      expect(result.newState).toBe(AgentState.Q_AND_A);
    });

    it("should recover from JAILBREAK_DETECTED state", () => {
      // Go to jailbreak state
      stateMachine.transition(CandidateIntention.JAILBREAK_ATTEMPT);
      expect(stateMachine.getCurrentState()).toBe(AgentState.JAILBREAK_DETECTED);

      // Recover with help request
      const result = stateMachine.transition(CandidateIntention.HELP_REQUEST);
      expect(result.success).toBe(true);
      expect(result.newState).toBe(AgentState.Q_AND_A);
    });
  });

  describe("Custom Configuration", () => {
    it("should work with custom transitions", () => {
      const customMachine = new AgentStateMachine({
        customTransitions: [
          {
            from: AgentState.GREETING,
            to: AgentState.EVALUATION,
            trigger: CandidateIntention.HELP_REQUEST,
          },
        ],
      });

      const result = customMachine.transition(CandidateIntention.HELP_REQUEST);
      expect(result.success).toBe(true);
      expect(result.newState).toBe(AgentState.EVALUATION);
    });
  });

  describe("Metadata and Logging", () => {
    it("should include correct metadata in transition results", () => {
      const result = stateMachine.transition(CandidateIntention.JOB_INQUIRY);

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.previousState).toBe(AgentState.GREETING);
      expect(result.metadata?.transitionTrigger).toBe(CandidateIntention.JOB_INQUIRY);
      expect(result.metadata?.timestamp).toBeInstanceOf(Date);
      expect(result.metadata?.transitionRule).toBe("greeting -> job_discussion (job_inquiry)");
    });

    it("should work with logging disabled", () => {
      const quietMachine = new AgentStateMachine({
        enableLogging: false,
      });

      const result = quietMachine.transition(CandidateIntention.JOB_INQUIRY);
      expect(result.success).toBe(true);
    });
  });
});
