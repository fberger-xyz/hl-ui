import LinkWrapper from '@/components/shared/Wrappers/LinkWrapper'
import PageWrapper from '@/components/shared/Wrappers/PageWrapper'
import { APP_PAGES } from '@/config/app.config'
import { cn } from '@/utils'
import { redirect } from 'next/navigation'

export default function NotFound() {
    redirect(APP_PAGES[0].path)
    return (
        <PageWrapper>
            <div className="mx-auto mt-40">
                <p>Not found.</p>

                <LinkWrapper href={APP_PAGES[0].path} className={cn('flex w-full cursor-pointer justify-center rounded-xl p-4 font-light')}>
                    <p>Go back</p>
                </LinkWrapper>
            </div>
        </PageWrapper>
    )
}
