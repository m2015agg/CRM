import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loading } from "@/components/ui/loading"

interface AuthLoadingScreenProps {
  message?: string
}

export function AuthLoadingScreen({ message = "Redirecting to your dashboard..." }: AuthLoadingScreenProps) {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Loading</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-6">
          <Loading size="md" text={message} />
        </CardContent>
      </Card>
    </div>
  )
}

