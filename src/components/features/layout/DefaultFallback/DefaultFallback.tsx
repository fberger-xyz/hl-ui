import PageWrapper from '@/components/shared/Wrappers/PageWrapper'
import Skeleton from '@/components/shared/Skeleton/Skeleton'

export function DefaultFallbackContent() {
    return (
        <>
            <Skeleton variant="text" />
        </>
    )
}

export default function DefaultFallback() {
    return (
        <PageWrapper>
            <DefaultFallbackContent />
        </PageWrapper>
    )
}
