import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SkillsForm } from "@/components/SkillsForm";
import { ResultsView } from "@/components/ResultsView";
import { Analysis, IntakeForm, SavedProfile } from "@/lib/unmapped-types";
import {
  deleteProfile,
  getProfiles,
  newProfileId,
  saveProfile,
} from "@/lib/storage";

const Index = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState<SavedProfile | null>(null);
  const [history, setHistory] = useState<SavedProfile[]>([]);

  useEffect(() => {
    setHistory(getProfiles());
  }, []);

  const refreshHistory = () => setHistory(getProfiles());

  const handleSubmit = async (form: IntakeForm) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze", {
        body: form,
      });

      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      const analysis = (data as any).analysis as Analysis;
      const marketUsed = !!(data as any).market_used;
      const profile: SavedProfile = {
        id: newProfileId(),
        createdAt: Date.now(),
        form,
        analysis,
        marketUsed,
      };
      saveProfile(profile);
      refreshHistory();
      setActive(profile);
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
    setActive(null);
    refreshHistory();
    window.scrollTo({ top: 0 });
  };

  const openHistory = (p: SavedProfile) => {
    setActive(p);
    window.scrollTo({ top: 0 });
  };

  const removeHistory = (id: string) => {
    deleteProfile(id);
    refreshHistory();
  };

  if (active) {
    return (
      <ResultsView
        profileId={active.id}
        form={active.form}
        analysis={active.analysis}
        marketUsed={active.marketUsed}
        onReset={reset}
      />
    );
  }

  return (
    <SkillsForm
      onSubmit={handleSubmit}
      loading={loading}
      history={history}
      onOpenHistory={openHistory}
      onDeleteHistory={removeHistory}
    />
  );
};

export default Index;
