namespace MyApi.DTOs;

public record CreateOrderDto(string CustomerName, string? CustomerEmail, List<OrderItemDto> Items);

public record OrderItemDto(Guid ProductId, int Quantity, decimal UnitPrice);
