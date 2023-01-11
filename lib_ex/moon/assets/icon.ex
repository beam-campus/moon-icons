defmodule Moon.Assets.Icon do
  @moduledoc """
  This module is deprecated. Please use `Moon.Icon` instead.
  """

  use MoonIcons.StatelessComponent

  prop(name, :string)
  prop(click, :event)
  prop(class, :css_class)

  # All the other props below are deprecated!
  # Please use only tailwind classes and the class prop
  prop(color, :string, values: colors())
  prop(background_color, :string, values: colors())
  prop(font_size, :string)

  def render(assigns) do
    ~F"""
    <svg
      class={
        "moon-icon",
        @class,
        "text-#{@color}": @color,
        "bg-#{@background_color}": @background_color,
        "text-#{@font_size}": @font_size,
        "cursor-pointer": @click
      }
      :on-click={@click}
      style={get_style(color: @color, background_color: @background_color, font_size: @font_size)}
    >
      <use href={"/moon_icons/icons/#{asset_name_to_filename(@name)}.svg#item"} />
    </svg>
    """
  end
end
