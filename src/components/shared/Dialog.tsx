import { ReactNode } from 'react'
import { Root, Portal, Overlay, Content } from '@radix-ui/react-dialog'

const Dialog = ({
  children,
  open,
  onOpenChange
}: {
  children: ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void | Promise<void>
}) => {
  return (
    <Root open={open} onOpenChange={onOpenChange}>
      <Portal>
        <Overlay className="flex justify-center py-6 z-10 bg-grey-dark/70 fixed inset-0 overflow-x-hidden overflow-y-auto data-[state=open]:animate-fadeIn data-[state=closed]:animate-fadeOut">
          <Content
            asChild={true}
            className="bg-blue-dark my-auto rounded-lg shadow-md data-[state=open]:animate-fadeInSlideUp"
          >
            {children}
          </Content>
        </Overlay>
      </Portal>
    </Root>
  )
}

export default Dialog
