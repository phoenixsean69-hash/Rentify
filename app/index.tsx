import useAuthStore from "@/store/auth.store";
import { router } from "expo-router";
import { useEffect } from "react";

const Index = () => {
  // ✅ Grab the user object from the store
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return; // handle case where user is null

    if (user.userMode === "landlord") {
      router.replace("/landHome");
    } else {
      router.replace("/tenantHome");
    }
  }, [user]);

  // Return a placeholder view while redirecting
  return null;
};

export default Index;
