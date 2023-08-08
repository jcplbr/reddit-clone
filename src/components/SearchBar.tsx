"use client"

import { FC, useCallback, useEffect, useRef, useState } from "react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/Command"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { Prisma, Subreddit } from "@prisma/client"
import { usePathname, useRouter } from "next/navigation"
import { Users } from "lucide-react"
import debounce from "lodash.debounce"
import { useOnClickOutside } from "@/hooks/use-on-click-outside"

interface SearchBarProps {}

const SearchBar: FC<SearchBarProps> = ({}) => {
  const [input, setInput] = useState<string>("")
  const commandRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()

  const {
    data: queryResults,
    refetch,
    isFetched,
    isFetching,
  } = useQuery({
    queryKey: ["search-query"],
    queryFn: async () => {
      if (!input) return []

      const { data } = await axios.get(`/api/search?q=${input}`)
      return data as (Subreddit & {
        _count: Prisma.SubredditCountOutputType
      })[]
    },
    enabled: false,
  })

  const request = debounce(async () => {
    refetch()
  }, 300)

  const debounceRequest = useCallback(() => {
    request()
  }, [])

  useOnClickOutside(commandRef, () => {
    setInput("")
  })

  useEffect(() => {
    setInput("")
  }, [pathname])

  return (
    <Command
      ref={commandRef}
      className="relative rounded-lg border max-w-lg z-50 overflow-visible"
    >
      <CommandInput
        value={input}
        onValueChange={(text) => {
          setInput(text)
          debounceRequest()
        }}
        placeholder="Search communities..."
        className="outline-none border-none focus:outline-none focus:border-none ring-0"
      />

      {input.length > 0 ? (
        <CommandList className="absolute bg-white top-full inset-x-0 shadow rounded-b-md">
          {isFetched && (
            <CommandEmpty>No results for &ldquo;{input}&rdquo;</CommandEmpty>
          )}
          {(queryResults?.length ?? 0) > 0 ? (
            <CommandGroup heading="Communities">
              {queryResults?.map((subreddit) => (
                <CommandItem
                  key={subreddit.id}
                  value={subreddit.name}
                  onSelect={(e) => {
                    router.push(`/r/${e}`)
                    router.refresh()
                  }}
                >
                  <Users className="mr-2 h-4 w-4" />
                  <a href={`/r/${subreddit.name}`}>r/{subreddit.name}</a>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
        </CommandList>
      ) : null}
    </Command>
  )
}

export default SearchBar
