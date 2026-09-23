import { AIProvider } from './aiProviderInterface';
import { RuleBasedAIProvider } from './ruleBasedProvider';

export class AIService {
  private activeProvider: AIProvider;

  constructor() {
    // Default to the deterministic rule-based engine which is fast, offline, and reliable
    this.activeProvider = new RuleBasedAIProvider();
  }

  setProvider(provider: AIProvider) {
    this.activeProvider = provider;
  }

  getProvider(): AIProvider {
    return this.activeProvider;
  }
}

export const aiService = new AIService();
