/**
 * MealSense Experiment Engine
 * Handles experiment definitions, variant assignment, and credibility standards.
 * Formats results and ensures simulated benchmarks are explicitly labeled.
 */

export class ExperimentEngine {
  /**
   * Retrieves registered experiments with normalized status and simulated/real result badges.
   */
  getExperiments(provider) {
    const rawExperiments = provider.getExperiments();

    return rawExperiments.map(exp => {
      const isSimulated = exp.simulatedResult ? !exp.simulatedResult.isRealData : false;

      return {
        id: exp.id,
        name: exp.name,
        hypothesis: exp.hypothesis,
        status: exp.status,
        audience: exp.audience,
        primaryMetric: exp.primaryMetric,
        guardrailMetric: exp.guardrailMetric,
        variants: exp.variants,
        activeVariant: exp.activeVariant || 'B',
        decision: exp.decision,
        result: exp.simulatedResult ? {
          ...exp.simulatedResult,
          badgeLabel: isSimulated ? 'Simulated Demo Benchmark' : 'Measured Empirical Result',
          isRealData: !isSimulated
        } : null
      };
    });
  }

  getVariant(experimentId, provider) {
    const exps = this.getExperiments(provider);
    const found = exps.find(e => e.id === experimentId);
    return found ? found.activeVariant : 'A';
  }
}

export const experimentEngine = new ExperimentEngine();
