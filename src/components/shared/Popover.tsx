import { ReactNode } from 'react'
import { Root, Trigger, Anchor, Portal, Content, Arrow } from '@radix-ui/react-popover'

const Popover = ({
  children,
  open,
  onOpenChange,
  trigger = null,
  anchor = null,
  side = 'bottom',
  align = 'center',
  sideOffset = 5,
  alignOffset = 0
}: {
  children: ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void | Promise<void>
  trigger?: ReactNode
  anchor?: ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
  alignOffset?: number
}) => {
  return (
    <Root open={open} onOpenChange={onOpenChange}>
      {trigger && <Trigger asChild>{trigger}</Trigger>}
      {anchor && <Anchor asChild>{anchor}</Anchor>}
      <Portal>
        <Content
          side={side}
          align={align}
          sideOffset={sideOffset}
          alignOffset={alignOffset}
          className="bg-white text-blue-dark rounded-lg shadow-md data-[state=open]:animate-fadeInSlideUp"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          {children}
          <Arrow className="fill-white" width={12} height={8} />
        </Content>
      </Portal>
    </Root>
  )
}

export default Popover
