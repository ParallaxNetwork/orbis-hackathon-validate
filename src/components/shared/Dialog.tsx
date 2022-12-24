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
        <Overlay className="bg-grey-dark/70 fixed inset-0 data-[state=open]:animate-fadeIn data-[state=closed]:animate-fadeOut" />
        <div className="w-full h-full fixed inset-0 flex items-center justify-center">
          <Content className="bg-blue-dark rounded-lg shadow-md data-[state=open]:animate-fadeInSlideUp">
            {children}
          </Content>
        </div>
      </Portal>
    </Root>
  )
}

export default Dialog
