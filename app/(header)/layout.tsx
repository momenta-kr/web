import React from 'react';
import {Header} from "@/components/radar/header";

type Props = {
    children: React.ReactNode;
}

const HeaderLayout = ({children}: Props) => {
    return (
        <div>
            <Header/>
            <div className="pt-16">
                {children}
            </div>
        </div>
    );
};

export default HeaderLayout;