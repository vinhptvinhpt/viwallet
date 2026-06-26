'use client'

import dynamic from 'next/dynamic'

const InstallBanner = dynamic(() => import('./InstallBanner'), { ssr: false })
const UpdateToast = dynamic(() => import('./UpdateToast'), { ssr: false })

export default function PwaComponents() {
  return (
    <>
      <InstallBanner />
      <UpdateToast />
    </>
  )
}
