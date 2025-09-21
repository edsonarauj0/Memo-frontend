import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { DEFAULT_PROJETO_ID } from "@/config/constants";
import { useAuth } from "@/hooks/useAuth";
import Comp270MessageError from "@/components/comp-270";
import GetStartedButton from "@/components/shsfui/button/get-started-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const authContext = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const user = await authContext.login({ email, password });
      const projetoId = user.projetoSelecionadoId ?? DEFAULT_PROJETO_ID;
      navigate(`/projeto/${projetoId}`, { replace: true });
    } catch (err) {
      toast.warning((err as Error).message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Entrar</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            {error && <Comp270MessageError message={error} />}
            <GetStartedButton type="submit" className="w-full">Entrar</GetStartedButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
