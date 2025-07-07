import { AgentState, AgentAction, StateTransition, AgentStateContext, StateTransitionResult, StateMachineConfig } from "./AgentStates";
import { CandidateIntention } from "../intention/IntentionTypes";
import { Logger } from "../utils/Logger";

/**
 * Modular AgentStateMachine class for managing recruitment conversation flow
 * Refactored for better maintainability and single responsibility
 */
export class AgentStateMachine {
  private context: AgentStateContext;
  private readonly config: StateMachineConfig;
  private readonly logger: Logger;
  private readonly stateTransitions: StateTransition[];
  private readonly stateActions: Map<AgentState, AgentAction[]>;
  private readonly stateHistory: AgentState[];

  constructor(config: StateMachineConfig = {}) {
    this.config = {
      initialState: AgentState.GREETING,
      enableLogging: true,
      enableStateHistory: true,
      customTransitions: [],
      ...config,
    };

    this.logger = Logger.getInstance();
    this.stateHistory = [];

    this.context = {
      currentState: this.config.initialState!,
      conversationData: {},
      timestamp: new Date(),
    };

    this.stateTransitions = this.initializeTransitions();
    this.stateActions = this.initializeStateActions();

    if (this.config.enableLogging) {
      this.logger.info("AgentStateMachine initialized", {
        initialState: this.context.currentState,
        config: this.config,
      });
    }
  }

  /**
   * Transitions to a new state based on intention
   * @param intention - The detected candidate intention
   * @param contextData - Additional context for the transition
   * @returns StateTransitionResult
   */
  public transition(intention: CandidateIntention, contextData?: Record<string, any>): StateTransitionResult {
    const currentState = this.context.currentState;

    if (this.config.enableLogging) {
      this.logger.debug("Attempting state transition", {
        currentState,
        intention,
        contextData,
      });
    }

    const validTransition = this.findValidTransition(intention, contextData);

    if (!validTransition) {
      const errorMessage = `No valid transition found for intention: ${intention} from state: ${currentState}`;

      if (this.config.enableLogging) {
        this.logger.warn("State transition failed", {
          currentState,
          intention,
          reason: errorMessage,
        });
      }

      return {
        success: false,
        newState: currentState,
        availableActions: this.getAvailableActions(),
        message: errorMessage,
      };
    }

    // Execute the transition
    const result = this.executeTransition(validTransition, intention, contextData);

    if (this.config.enableLogging) {
      this.logger.info("State transition completed", {
        previousState: result.metadata?.previousState,
        newState: result.newState,
        intention,
        success: result.success,
      });
    }

    return result;
  }

  /**
   * Gets available actions for the current state
   * @returns Array of available actions
   */
  public getAvailableActions(): AgentAction[] {
    return this.stateActions.get(this.context.currentState) || [];
  }

  /**
   * Gets the current state
   * @returns Current agent state
   */
  public getCurrentState(): AgentState {
    return this.context.currentState;
  }

  /**
   * Gets the current context
   * @returns Current agent state context (copy)
   */
  public getContext(): AgentStateContext {
    return { ...this.context };
  }

  /**
   * Gets the state history (if enabled)
   * @returns Array of previous states
   */
  public getStateHistory(): AgentState[] {
    return this.config.enableStateHistory ? [...this.stateHistory] : [];
  }

  /**
   * Resets the state machine to initial state
   * @param initialState - The state to reset to (optional)
   */
  public reset(initialState?: AgentState): void {
    const newInitialState = initialState || this.config.initialState || AgentState.GREETING;

    this.context = {
      currentState: newInitialState,
      conversationData: {},
      timestamp: new Date(),
    };

    if (this.config.enableStateHistory) {
      this.stateHistory.length = 0; // Clear history
    }

    if (this.config.enableLogging) {
      this.logger.info("State machine reset", { newInitialState });
    }
  }

  /**
   * Checks if a transition is valid for the current state
   * @param intention - The candidate intention
   * @param contextData - Additional context
   * @returns boolean
   */
  public canTransition(intention: CandidateIntention, contextData?: Record<string, any>): boolean {
    return this.findValidTransition(intention, contextData) !== null;
  }

  /**
   * Forces a state transition (for error handling or admin actions)
   * @param newState - The state to transition to
   * @param reason - Reason for the forced transition
   */
  public forceTransition(newState: AgentState, reason?: string): void {
    const previousState = this.context.currentState;

    this.updateContext(newState, { forceTransitionReason: reason });

    if (this.config.enableLogging) {
      this.logger.warn("Forced state transition", {
        previousState,
        newState,
        reason: reason || "No reason provided",
      });
    }
  }

  /**
   * Validates the current state machine configuration
   * @returns Array of validation errors (empty if valid)
   */
  public validateConfiguration(): string[] {
    const errors: string[] = [];

    // Check if all states have actions defined
    for (const state of Object.values(AgentState)) {
      if (!this.stateActions.has(state)) {
        errors.push(`No actions defined for state: ${state}`);
      }
    }

    // Check for unreachable states
    const reachableStates = new Set<AgentState>([this.config.initialState!]);
    for (const transition of this.stateTransitions) {
      reachableStates.add(transition.to);
    }

    for (const state of Object.values(AgentState)) {
      if (!reachableStates.has(state)) {
        errors.push(`Unreachable state: ${state}`);
      }
    }

    return errors;
  }

  /**
   * Executes a validated state transition
   * @param transition - The transition to execute
   * @param intention - The triggering intention
   * @param contextData - Additional context data
   * @returns StateTransitionResult
   */
  private executeTransition(transition: StateTransition, intention: CandidateIntention, contextData?: Record<string, any>): StateTransitionResult {
    const previousState = this.context.currentState;

    // Update context
    this.updateContext(transition.to, contextData);

    return {
      success: true,
      newState: this.context.currentState,
      availableActions: this.getAvailableActions(),
      metadata: {
        previousState,
        transitionTrigger: intention,
        timestamp: this.context.timestamp,
        transitionRule: `${transition.from} -> ${transition.to} (${intention})`,
      },
    };
  }

  /**
   * Updates the internal context state
   * @param newState - The new state to transition to
   * @param contextData - Additional context data to merge
   */
  private updateContext(newState: AgentState, contextData?: Record<string, any>): void {
    // Record state history
    if (this.config.enableStateHistory) {
      this.stateHistory.push(this.context.currentState);
    }

    // Update context
    this.context.previousState = this.context.currentState;
    this.context.currentState = newState;
    this.context.timestamp = new Date();

    if (contextData) {
      this.context.conversationData = { ...this.context.conversationData, ...contextData };
    }
  }

  /**
   * Initializes the state transitions map with all possible transitions
   * @returns Array of state transitions
   */
  private initializeTransitions(): StateTransition[] {
    const baseTransitions: StateTransition[] = [
      // Greeting state transitions - prioritize JOB_DISCUSSION over JOB_PRESENTATION
      { from: AgentState.GREETING, to: AgentState.JOB_DISCUSSION, trigger: CandidateIntention.JOB_INQUIRY },
      { from: AgentState.GREETING, to: AgentState.DOCUMENT_COLLECTION, trigger: CandidateIntention.CV_UPLOAD },
      { from: AgentState.GREETING, to: AgentState.Q_AND_A, trigger: CandidateIntention.SALARY_QUESTION },
      { from: AgentState.GREETING, to: AgentState.Q_AND_A, trigger: CandidateIntention.BENEFITS_QUESTION },
      { from: AgentState.GREETING, to: AgentState.JAILBREAK_DETECTED, trigger: CandidateIntention.JAILBREAK_ATTEMPT },
      { from: AgentState.GREETING, to: AgentState.APPLICATION_REVIEW, trigger: CandidateIntention.APPLICATION_STATUS },
      { from: AgentState.GREETING, to: AgentState.INTERVIEW_PREPARATION, trigger: CandidateIntention.INTERVIEW_PREP },
      { from: AgentState.GREETING, to: AgentState.CLOSING, trigger: CandidateIntention.FAREWELL },

      // Job discussion state transitions (replacing job presentation)
      { from: AgentState.JOB_DISCUSSION, to: AgentState.Q_AND_A, trigger: CandidateIntention.SALARY_QUESTION },
      { from: AgentState.JOB_DISCUSSION, to: AgentState.Q_AND_A, trigger: CandidateIntention.BENEFITS_QUESTION },
      { from: AgentState.JOB_DISCUSSION, to: AgentState.SURVEY, trigger: CandidateIntention.EXPERIENCE_VALIDATION },
      { from: AgentState.JOB_DISCUSSION, to: AgentState.CLOSING, trigger: CandidateIntention.FAREWELL },

      // Job presentation compatibility (kept for enum completeness)
      { from: AgentState.JOB_DISCUSSION, to: AgentState.JOB_PRESENTATION, trigger: CandidateIntention.HELP_REQUEST },

      // Q&A state transitions
      { from: AgentState.Q_AND_A, to: AgentState.SURVEY, trigger: CandidateIntention.EXPERIENCE_VALIDATION },
      { from: AgentState.Q_AND_A, to: AgentState.CV_PROCESSING, trigger: CandidateIntention.CV_UPLOAD },
      { from: AgentState.Q_AND_A, to: AgentState.CLOSING, trigger: CandidateIntention.FAREWELL },

      // Survey state transitions
      { from: AgentState.SURVEY, to: AgentState.CV_PROCESSING, trigger: CandidateIntention.CV_UPLOAD },
      { from: AgentState.SURVEY, to: AgentState.TECHNICAL_VALIDATION, trigger: CandidateIntention.TECHNICAL_SKILLS_DISCUSSION },
      { from: AgentState.SURVEY, to: AgentState.CLOSING, trigger: CandidateIntention.FAREWELL },

      // CV processing state transitions
      { from: AgentState.CV_PROCESSING, to: AgentState.TECHNICAL_VALIDATION, trigger: CandidateIntention.TECHNICAL_SKILLS_DISCUSSION },
      { from: AgentState.CV_PROCESSING, to: AgentState.SKILL_ASSESSMENT, trigger: CandidateIntention.EXPERIENCE_VALIDATION },
      { from: AgentState.CV_PROCESSING, to: AgentState.FINAL_INTERVIEW, trigger: CandidateIntention.EXPERIENCE_VALIDATION },
      { from: AgentState.CV_PROCESSING, to: AgentState.CV_UPLOADED, trigger: CandidateIntention.CV_UPLOAD },

      // Technical validation state transitions
      { from: AgentState.TECHNICAL_VALIDATION, to: AgentState.SKILL_ASSESSMENT, trigger: CandidateIntention.EXPERIENCE_VALIDATION },
      { from: AgentState.TECHNICAL_VALIDATION, to: AgentState.FINAL_INTERVIEW, trigger: CandidateIntention.EXPERIENCE_VALIDATION },

      // Skill assessment state transitions
      { from: AgentState.SKILL_ASSESSMENT, to: AgentState.FINAL_INTERVIEW, trigger: CandidateIntention.EXPERIENCE_VALIDATION },
      { from: AgentState.SKILL_ASSESSMENT, to: AgentState.EVALUATION, trigger: CandidateIntention.FAREWELL },

      // Final interview state transitions
      { from: AgentState.FINAL_INTERVIEW, to: AgentState.CLOSING, trigger: CandidateIntention.FAREWELL },

      // Evaluation state transitions
      { from: AgentState.EVALUATION, to: AgentState.CLOSING, trigger: CandidateIntention.FAREWELL },

      // New state transitions for additional enum values
      { from: AgentState.APPLICATION_REVIEW, to: AgentState.INTERVIEW_SCHEDULING, trigger: CandidateIntention.INTERVIEW_PREP },
      { from: AgentState.APPLICATION_REVIEW, to: AgentState.DOCUMENT_COLLECTION, trigger: CandidateIntention.CV_UPLOAD },
      { from: AgentState.APPLICATION_REVIEW, to: AgentState.CLOSING, trigger: CandidateIntention.FAREWELL },

      { from: AgentState.INTERVIEW_PREPARATION, to: AgentState.INTERVIEW_SCHEDULING, trigger: CandidateIntention.EXPERIENCE_VALIDATION },
      { from: AgentState.INTERVIEW_PREPARATION, to: AgentState.CLOSING, trigger: CandidateIntention.FAREWELL },

      { from: AgentState.INTERVIEW_SCHEDULING, to: AgentState.CLOSING, trigger: CandidateIntention.FAREWELL },
      { from: AgentState.INTERVIEW_SCHEDULING, to: AgentState.DOCUMENT_COLLECTION, trigger: CandidateIntention.CV_UPLOAD },

      { from: AgentState.DOCUMENT_COLLECTION, to: AgentState.CV_UPLOADED, trigger: CandidateIntention.CV_UPLOAD },
      { from: AgentState.DOCUMENT_COLLECTION, to: AgentState.CLOSING, trigger: CandidateIntention.FAREWELL },

      { from: AgentState.CV_UPLOADED, to: AgentState.APPLICATION_REVIEW, trigger: CandidateIntention.APPLICATION_STATUS },
      { from: AgentState.CV_UPLOADED, to: AgentState.CLOSING, trigger: CandidateIntention.FAREWELL },

      // Error and jailbreak handling
      { from: AgentState.ERROR, to: AgentState.Q_AND_A, trigger: CandidateIntention.HELP_REQUEST },
      { from: AgentState.JAILBREAK_DETECTED, to: AgentState.Q_AND_A, trigger: CandidateIntention.HELP_REQUEST },

      // Universal transitions (available from any state)
      ...this.createUniversalErrorTransitions(),
    ];

    // Add custom transitions if provided
    if (this.config.customTransitions) {
      baseTransitions.push(...this.config.customTransitions);
    }

    return baseTransitions;
  }

  /**
   * Creates universal error transitions from all states
   * @returns Array of universal error transitions
   */
  private createUniversalErrorTransitions(): StateTransition[] {
    const errorStates: AgentState[] = [
      AgentState.GREETING,
      AgentState.JOB_DISCUSSION,
      AgentState.Q_AND_A,
      AgentState.SURVEY,
      AgentState.CV_PROCESSING,
      AgentState.TECHNICAL_VALIDATION,
      AgentState.SKILL_ASSESSMENT,
      AgentState.FINAL_INTERVIEW,
    ];

    return errorStates.map((state) => ({
      from: state,
      to: AgentState.ERROR,
      trigger: CandidateIntention.UNKNOWN,
    }));
  }

  /**
   * Initializes the state actions map
   * @returns Map of states to available actions
   */
  private initializeStateActions(): Map<AgentState, AgentAction[]> {
    const stateActions = new Map<AgentState, AgentAction[]>();

    stateActions.set(AgentState.GREETING, [AgentAction.SEND_GREETING, AgentAction.PRESENT_JOB, AgentAction.REQUEST_CLARIFICATION]);

    stateActions.set(AgentState.JOB_PRESENTATION, [AgentAction.PRESENT_JOB, AgentAction.ANSWER_QUESTION, AgentAction.ASK_SURVEY_QUESTION]);

    stateActions.set(AgentState.Q_AND_A, [AgentAction.ANSWER_QUESTION, AgentAction.ASK_SURVEY_QUESTION, AgentAction.REQUEST_CLARIFICATION]);

    stateActions.set(AgentState.SURVEY, [AgentAction.ASK_SURVEY_QUESTION, AgentAction.PROCESS_CV, AgentAction.VALIDATE_TECHNICAL_SKILLS]);

    stateActions.set(AgentState.CV_PROCESSING, [AgentAction.PROCESS_CV, AgentAction.VALIDATE_TECHNICAL_SKILLS, AgentAction.ASK_SURVEY_QUESTION]);

    stateActions.set(AgentState.TECHNICAL_VALIDATION, [
      AgentAction.VALIDATE_TECHNICAL_SKILLS,
      AgentAction.CONDUCT_SKILL_ASSESSMENT,
      AgentAction.ASK_SURVEY_QUESTION,
    ]);

    stateActions.set(AgentState.SKILL_ASSESSMENT, [
      AgentAction.CONDUCT_SKILL_ASSESSMENT,
      AgentAction.CONDUCT_FINAL_INTERVIEW,
      AgentAction.GENERATE_REPORT,
    ]);

    stateActions.set(AgentState.FINAL_INTERVIEW, [AgentAction.CONDUCT_FINAL_INTERVIEW, AgentAction.GENERATE_REPORT, AgentAction.END_CONVERSATION]);

    stateActions.set(AgentState.EVALUATION, [AgentAction.GENERATE_REPORT, AgentAction.END_CONVERSATION]);

    stateActions.set(AgentState.CLOSING, [AgentAction.END_CONVERSATION, AgentAction.GENERATE_REPORT]);

    stateActions.set(AgentState.ERROR, [AgentAction.HANDLE_ERROR, AgentAction.REQUEST_CLARIFICATION, AgentAction.SEND_GREETING]);

    stateActions.set(AgentState.JAILBREAK_DETECTED, [AgentAction.BLOCK_JAILBREAK, AgentAction.REQUEST_CLARIFICATION]);

    // Additional state actions for new enum values
    stateActions.set(AgentState.INTERVIEW_PREPARATION, [
      AgentAction.CONDUCT_SKILL_ASSESSMENT,
      AgentAction.CONDUCT_FINAL_INTERVIEW,
      AgentAction.REQUEST_CLARIFICATION,
    ]);

    stateActions.set(AgentState.JOB_DISCUSSION, [AgentAction.PRESENT_JOB, AgentAction.ANSWER_QUESTION, AgentAction.ASK_SURVEY_QUESTION]);

    stateActions.set(AgentState.DOCUMENT_COLLECTION, [AgentAction.PROCESS_CV, AgentAction.REQUEST_CLARIFICATION, AgentAction.ASK_SURVEY_QUESTION]);

    stateActions.set(AgentState.CV_UPLOADED, [
      AgentAction.VALIDATE_TECHNICAL_SKILLS,
      AgentAction.ASK_SURVEY_QUESTION,
      AgentAction.CONDUCT_SKILL_ASSESSMENT,
    ]);

    stateActions.set(AgentState.APPLICATION_REVIEW, [AgentAction.GENERATE_REPORT, AgentAction.ANSWER_QUESTION, AgentAction.REQUEST_CLARIFICATION]);

    stateActions.set(AgentState.INTERVIEW_SCHEDULING, [
      AgentAction.CONDUCT_FINAL_INTERVIEW,
      AgentAction.REQUEST_CLARIFICATION,
      AgentAction.ASK_SURVEY_QUESTION,
    ]);

    return stateActions;
  }

  /**
   * Finds a valid transition for the given intention and context
   * @param intention - The candidate intention
   * @param contextData - Additional context
   * @returns StateTransition or null
   */
  private findValidTransition(intention: CandidateIntention, contextData?: Record<string, any>): StateTransition | null {
    const validTransitions = this.stateTransitions.filter(
      (transition) => transition.from === this.context.currentState && transition.trigger === intention,
    );

    // If no transitions found, return null
    if (validTransitions.length === 0) {
      return null;
    }

    // If only one transition, check its condition
    if (validTransitions.length === 1) {
      const transition = validTransitions[0];
      return !transition.condition || transition.condition(contextData) ? transition : null;
    }

    // If multiple transitions, find the first one that meets conditions
    for (const transition of validTransitions) {
      if (!transition.condition || transition.condition(contextData)) {
        return transition;
      }
    }

    return null;
  }
}
