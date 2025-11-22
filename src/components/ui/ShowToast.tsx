import { toast } from '@pheralb/toast'

export default function ShowToast() {
     return (
          <button
               type="button"
               onClick={() => toast.success({ text: 'Toast funcionando!' })}
          >
               Show Toast
          </button>
     )
}
