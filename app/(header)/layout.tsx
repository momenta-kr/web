import React from 'react';
import {Header} from "@/components/radar/header";

type Props = {
  children: React.ReactNode;
}

const HeaderLayout = ({children}: Props) => {
  return (
    <div>
      <Header />
      {children}
    </div>
  );
};

export default HeaderLayout;