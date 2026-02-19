import { redirect } from 'next/navigation'

export default function Home() {
    // O porteiro mandando todo mundo para a sala certa
    redirect('/executar')
}