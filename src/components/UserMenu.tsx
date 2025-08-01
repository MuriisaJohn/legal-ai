import React, { useEffect, useState } from 'react';
// import { getUser, signOut } from '@/services/authService';
import { Button } from '@/components/ui/button';

const UserMenu: React.FC = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    (async () => {
      // const u = await getUser();
      const u = null;
      setUser(u);
    })();
  }, []);

  const handleLogout = async () => {
    // await signOut();
    setUser(null);
    window.location.reload(); // Optionally reload to reset state
  };

  if (!user) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-700">{user.email}</span>
      <Button size="sm" variant="outline" onClick={handleLogout}>Logout</Button>
    </div>
  );
};

export default UserMenu;
