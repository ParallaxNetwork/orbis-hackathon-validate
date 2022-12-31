import {
  Root,
  Portal,
  Overlay,
  Content,
  Title,
  Description,
  Action,
  Cancel
} from '@radix-ui/react-alert-dialog'

const AlertDialog = ({
  open,
  onOpenChange,
  title,
  description,
  cancelText = 'Cancel',
  confirmText = 'Confirm',
  onConfirm
}: {
  open: boolean
  onOpenChange: (open: boolean) => void | Promise<void>
  title: string
  description: string
  cancelText?: string
  confirmText?: string
  onConfirm: () => void | Promise<void>
}) => {
  return (
    <Root open={open} onOpenChange={onOpenChange}>
      <Portal>
        <Overlay className="bg-grey-dark/70 fixed inset-0 data-[state=open]:animate-fadeIn data-[state=closed]:animate-fadeOut" />
        <div className="w-full h-full fixed inset-0 flex items-center justify-center">
          <Content className="bg-blue-dark rounded-lg shadow-md data-[state=open]:animate-fadeInSlideUp">
            <Title className="text-white font-title text-large text-center p-4 border-b border-b-muted">
              {title}
            </Title>
            <Description className="text-secondary text-center text-sm p-4 border-b border-b-muted">
              {description}
            </Description>
            <div className="flex items-center justify-center gap-2 p-4">
              <Cancel className="btn btn-pill bg-white text-blue-dark">
                {cancelText}
              </Cancel>
              <Action
                className="btn btn-pill bg-primary text-blue-dark"
                onClick={onConfirm}
              >
                {confirmText}
              </Action>
            </div>
          </Content>
        </div>
      </Portal>
    </Root>
  )
}

export default AlertDialog
