import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Groups | QueComemos',
  description: 'Manage your meal groups and collaborate with other users',
};

export default function GroupsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}