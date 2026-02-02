import React from 'react';
import {MobileBottomNav} from "@/components/radar/mobile-bottom-nav";

type Props = {
  children: React.ReactNode;
}

const HeaderLayout = ({children}: Props) => {
  return (
    <div>
      {children}
      <MobileBottomNav />
    </div>
  );
};

export default HeaderLayout;