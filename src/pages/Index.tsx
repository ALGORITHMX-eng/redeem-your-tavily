import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SkillsForm } from "@/components/SkillsForm";
import { ResultsView } from "@/components/ResultsView";
import { Analysis, IntakeForm } from "@/lib/unmapped-types";

const Index = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState<IntakeForm | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [marketUsed, setMarketUsed] = useState(false);

  const handleSubmit = async (form: IntakeForm) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze", {
        body: form,
      });

      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      setAnalysis((data as any).analysis as Analysis);
      setMarketUsed(!!(data as any).market_used);
      setSubmitted(form);
      window.scrollTo({ top: 0 });
    } catch (e: any) {
      console.error(e);
      const msg = e?.message || "Something went wrong. Please try again.";
      toast({
        title: "Could not map your skills",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setAnalysis(null);
    setSubmitted(null);
  };

  if (analysis && submitted) {
    return (
      <ResultsView
        name={submitted.name}
        location={submitted.location}
        analysis={analysis}
        marketUsed={marketUsed}
        onReset={reset}
      />
    );
  }

  return <SkillsForm onSubmit={handleSubmit} loading={loading} />;
};

export default Index;
