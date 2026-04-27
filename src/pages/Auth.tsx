import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/admin", { replace: true });
    });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Logado!");
    navigate("/admin", { replace: true });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/admin` },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Conta criada! Faça login.");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Painel Admin</h1>
        <Tabs defaultValue="login">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">Entrar</TabsTrigger>
            <TabsTrigger value="signup">Criar conta</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="login-email">Email</Label>
                <Input id="login-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="login-password">Senha</Label>
                <Input id="login-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <Label htmlFor="signup-email">Email</Label>
                <Input id="signup-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="signup-password">Senha (mín. 6 caracteres)</Label>
                <Input id="signup-password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Criando..." : "Criar conta"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Após criar, peça ao desenvolvedor para te promover a admin.
              </p>
            </form>
          </TabsContent>
        </Tabs>
        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:underline">← Voltar ao site</Link>
        </div>
      </Card>
    </div>
  );
}